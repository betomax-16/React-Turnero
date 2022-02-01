import { useContext, useEffect } from "react";
import AppContext from "../../../context/app/app-context";
import './styles.css';
import wave from '../../../public/img/waves.svg';
import sound from "../../../public/sounds/timbre.mp3";

function CurrentTurn(props) {
  const { module } = useContext(AppContext);
  useEffect(() => {
    if (props.playSound) {
      const audio = new Audio(sound);
      let promise = audio.play();

      if (promise !== undefined) {
        promise.then(_ => {
          audio.autoplay = true;
        }).catch(error => {
          console.log(error);
        });
      }
    }
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="currentTurn-container">
        <div className="turn-info">
            <div className="frame">
                <h2 className="title">Turno</h2>
                <span className="turn">{props.currentTurn.turn}</span>
            </div>
        </div>
        <div className="module">
          {module && <span className="currentTurn-ubication">{module.name}</span>}  
          {!module && <span className="currentTurn-ubication">{props.currentTurn.ubication}</span>}  
          <img className={`wave ${props.wave}`} src={wave} alt="onda decorativa"/>
        </div>
    </div>
  );
}

export default CurrentTurn;