import { useContext, useState, useEffect } from "react";
import AppContext from "../../../context/app/app-context";
import Confirm from "../../utils/confirm/confirm";
import './styles.css';

function Attend(props) {
    const { module } = useContext(AppContext);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [disabledButtons, setDisabledButtons] = useState(false);

    useEffect(() => {
        setDisabledButtons(module && module.status);
    }, [module]);

    const handleAcceptConfirm = async () => {
        props.handlerCancelationTurn();
        setOpenConfirm(false);
    };

    const handleCloseConfirm = () => {
        setOpenConfirm(false);
    };

    return (<>
        <div className="attend-container">
            <div className="attend-options">
                <div className="attend-title">
                    <h2>Atender turno</h2>
                </div>
                {!props.isModuleFree && 
                <div className="attend-buttons">
                    {module && module.mode === 'auto' &&
                    <div onClick={() => props.handlerAttendTurn('')}
                        className={disabledButtons ? "attend-button-next disabled" : "attend-button-next"}>
                        <span className="attend-text">Siguiente</span>
                    </div>}
                    {module && module.mode === 'manual' && <>
                    {props.areas.map((area, index) => <div key={index} onClick={() => props.handlerAttendTurn(area.name)} 
                        className={disabledButtons ? 'attend-button disabled' : 'attend-button'}>
                        <span className="attend-number">{area.number}</span>
                        <span className="attend-text">{area.name}</span>
                    </div>)}
                    </>}
                </div>
                }
            </div>
            {module && module.status &&
            <div className="attend-current">
                <div className="current-button recall" onClick={props.handlerReCallTurn}>Re-llamar</div>
                <div className="current-content">
                    <h4 className="current-title">Turno en atención</h4>
                    <span className="current-turn">{props.currentTurn.turn}</span>
                </div>
                <div className="current-buttons">
                    <div className="current-button cancel" onClick={() => {setOpenConfirm(true)}}>Cancelar</div>
                    <div className="current-button accept" onClick={props.handlerAttendedTurn}>Atendido</div>
                </div>
            </div>
            }
        </div>
        <Confirm 
            open={openConfirm}
            title={'Cacenlar turno'} 
            message={`¿Desea realmente cancelar el turno: ${props.currentTurn.turn}?`} 
            handleClose={handleCloseConfirm}
            handleAccept={handleAcceptConfirm}/>
    </>
    );
}

export default Attend;