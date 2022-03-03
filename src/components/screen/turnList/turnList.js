import { useEffect, useState } from "react";
import CurrentTurn from "../currentTurn/currentTurn";
import './styles.css';
import add from "../../../public/img/adds/aviso-covid.jpeg";

function TurnList(props) {
    const [showAdd, setShowAdd] = useState(false);
    
    useEffect(() => {
        if (props.showAdds) {
            setTimeout(() => { 
                setShowAdd(true);
            }, 1000 * 60);
        }
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="turnList-container">
            <div className="turnList-info">
                {showAdd ? <img alt="adds" className="add" src={add}/> :
                <CurrentTurn currentTurn={props.currentTurn}/>
                }
            </div>
            <div className="turnList">
                <div className="sub-title">
                    Ultimos llamados
                </div>
                <div className="turns">
                    {props.lastTurns.map((item, index) => <div key={index} className="turn-card">
                        <div className="title">{item.ubication}</div>
                        <div className="body">{item.turn}</div>
                    </div>)}
                </div>
                <div className="today-date">
                    <div className="date">{props.date.format('DD') + ' de ' + props.date.format('MMMM ')} <span>{props.date.format('YYYY')}</span></div>
                    <div className="hour">{props.date.format('hh:mm')} <span>{props.date.format('A')}</span></div>
                </div>
            </div>
        </div>
    );
}

export default TurnList;