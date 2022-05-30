import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";


import api from "../services/api";

import Modal from "react-modal"

import addIcon from "../assets/images/addIcon.svg"
import deleteIcon from "../assets/images/deleteIcon.svg"
import editIcon from "../assets/images/editIcon.svg"
import flashcardIcon from "../assets/images/flashcardIcon.svg"

import '../styles/flashcardList.scss';

type FlashcardProps = {
    id: string;
    term: string;
    definition: string;
}

type FlashcardListProps = {
    deckId: number
}

Modal.setAppElement('#root');

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
    },
};

export function FlashcardList(props: FlashcardListProps) {
    const { user } = useAuth();
    const [list, setList] = useState<FlashcardProps[]>([]);
    const [modalIsOpen, setIsOpen] = useState(false);
    const [edit, setEdit] = useState(false);
    const [term, setTerm] = useState('');
    const [definition, setDefinition] = useState('');
    const [previousTerm, setPreviousTerm] = useState('');

    let subtitle: HTMLHeadingElement | null;

    function openModal() {
        setIsOpen(true);
    }

    function afterOpenModal() {
        if (subtitle != null) subtitle.style.color = '#FF5050';
    }

    function closeModal() {
        setTerm('');
        setDefinition('');
        setIsOpen(false);
    }

    useEffect(() => {
        const userId = user?.id || ""
        if (props.deckId !== -1) {
            api.post("/getDeck", {
                userId: userId,
                deckId: props.deckId.toString()
            }).then((response) => {
                setList([]);
                for (let i = 0; i < response.data.flashCards.length; i++) {
                    const newFlashcard = {
                        id: response.data.flashCards[i].term,
                        term: response.data.flashCards[i].term,
                        definition: response.data.flashCards[i].definition
                    }
                    setList(list => [...list, newFlashcard]);
                }
            })
        }
    }, [props.deckId]);

    function handleTermChange(event: React.FormEvent<HTMLInputElement>) {
        event.preventDefault();
        setTerm(event.currentTarget.value)
    }
    function handleDefinitionChange(event: React.FormEvent<HTMLTextAreaElement>) {
        event.preventDefault();
        setDefinition(event.currentTarget.value);
    }


    function handleAddFlashcard() {
        if (term && definition) {
            
            const userId = user?.id || " "
            if(!edit){
                const newFlashcard = {
                    id: term,
                    term: term,
                    definition: definition
                }
                api.post("/createFlashcard", {
                    userId: userId,
                    deck: props.deckId.toString(),
                    flashCardId: newFlashcard.id,
                    term: newFlashcard.term,
                    definition: newFlashcard.definition
                }).catch(error => {
                    console.log(error.response)
                })
                setList(list => [...list, newFlashcard]);
            }else if(edit){
                const newFlashcard = {
                    id: list.find(flashcard => flashcard.id == previousTerm)?.id,
                    term: term,
                    definition: definition
                }
                console.log(list.find(flashcard => flashcard.id == previousTerm))
                console.log(newFlashcard.id)
                setList(list => list.map(flashcard => flashcard.term === term? {...flashcard, newFlashcard}: flashcard))
                api.put("/updateFlashCard", {
                    userId: userId,
                    deck: props.deckId.toString(),
                    flashCardId: newFlashcard.id,
                    term: newFlashcard.term,
                    definition: newFlashcard.definition
                }).catch(error => {
                    console.log(error.response)
                })
            }
        }
        setEdit(false);
        closeModal();
    }

    function handleDeleteFlashcard(id: string) {
        setList(list => list.filter(flashcard => flashcard.id !== id))
        api.delete("/deleteFlashCard", {
            data: {
                userId: user?.id,
                deck: props.deckId,
                flashCardId: id
            }
        }).catch(error => {
            console.log(error.response)
        })
    }


    function handleEditFlashcard(term: string, definition: string, id: string) {
        setTerm(term);
        setPreviousTerm(id);
        setDefinition(definition);
        setEdit(true);
        openModal();
    }
    return (
        <div id="flashcardList">
            <Modal isOpen={modalIsOpen} onAfterOpen={afterOpenModal} onRequestClose={closeModal} style={customStyles}>
                <div className="modal">
                    <h2 ref={(_subtitle) => (subtitle = _subtitle)}>Crie seu Flashcard</h2>
                    <form className="modalForm">
                        <label>Termo:</label>
                        <input type="text" name="term" onChange={handleTermChange} value={term ? term : ""} />
                        <label>Definição:</label>
                        <textarea name="definition" id="txtArea" rows={10} cols={70} onChange={handleDefinitionChange} value={definition ? definition : ""}></textarea>
                        <button className="btn" onClick={handleAddFlashcard}>Confirmar</button>
                    </form>
                    <button className="btn" onClick={closeModal}>Fechar</button>
                </div>
            </Modal>
            {list.length < 22 ?
                <div>
                    <button id = "add-btn" onClick={openModal}><img src={addIcon} alt="add icon" /></button>
                </div>
                : <></>}
            <div id="flashcardDisplay">
                {list.map(item => (
                    <div key={item.id} className="item">
                        <div id="flashcard">
                            <img src={flashcardIcon} alt="cardIcon" />
                            <label>{item.term}</label>
                        </div>
                        <div id="flashcardsOptions">
                            <button onClick={() => handleEditFlashcard(item.term, item.definition, item.id)}><img src={editIcon} alt="edit icon" /></button>
                            <button onClick={function () { handleDeleteFlashcard(item.id) }}><img src={deleteIcon} alt="delete icon" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}