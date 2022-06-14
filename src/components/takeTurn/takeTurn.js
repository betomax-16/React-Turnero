import { useEffect, useState, useContext } from "react";
import socketIOClient from "socket.io-client";
import axios from 'axios';
import AppContext from "../../context/app/app-context";
import './styles.css';
import logo from '../../public/img/logo.png';
import sound from "../../public/sounds/timbre.mp3";
const W3CWebSocket = require('websocket').w3cwebsocket;

function TakeTurn(props) {
  const ENDPOINT = `http://${window.location.hostname}:4000`;
  const [socket, setSocket] = useState(null);
  const [socketPrint, setSocketPrint] = useState(null);
  const [sucursal, setSucursal] = useState(null);
  const { showAlert } = useContext(AppContext);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    try {
      callGetSucursal(); 
    } catch (error) {
      console.log(error);
      if (error.response && error.response.data) {
          showAlert("red", error.response.data.body.message);
      }
      else {
          showAlert("red", 'Ocurrió algún error interno.');
      }
    }
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  const callGetSucursal = async () => {
    try {
      const suc = window.atob(props.match.params.suc);      
      const res = await axios.get(`http://${window.location.hostname}:5000/api/sucursal/${suc}`);
      if (res.data.statusCode === 200) {
        setSucursal(res.data.body);
        callGetAreas(suc);
        setSocket(socketIOClient(ENDPOINT));
        const client = new W3CWebSocket(`ws://${window.location.hostname}:7000/`);
        client.onopen = function() {
            if (client.readyState === client.OPEN) {
              setSocketPrint(client);   
            }
        };
        // setSucursalExist(true);
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.data) {
          showAlert("red", error.response.data.body.message);
      }
      else {
          showAlert("red", 'Ocurrió algún error interno.');
      }
    }
    
  };

  const callGetAreas = async (suc) => {
    try {
      const res = await axios.get(`http://${window.location.hostname}:4000/api/area-sucursal/${suc}`);
      setAreas(res.data.body); 
    } catch (error) {
      throw error;
    }
  };

  const takeTurn = async (area) => {
    try {
      const data = {
        area: area,
        sucursal: sucursal.name
      };
      const res = await axios.post(`http://${window.location.hostname}:4000/api/action/take`, data);

      socket.emit('newTurn', {sucursal:sucursal.name, data:res.data.body});
      sendPrint(res.data.body);

      const audio = new Audio(sound);
      let promise = audio.play();

      if (promise !== undefined) {
        promise.then(_ => {
          audio.autoplay = true;
        }).catch(error => {
          console.log(error);
        });
      }

      showAlert("green", "Turno creado."); 
    } catch (error) {
      console.log(error);
      if (error.response && error.response.data) {
          showAlert("red", error.response.data.body.message);
      }
      else {
          showAlert("red", 'Ocurrió algún error interno.');
      }
    }
  }

  const sendPrint = (dataSend) => {
    try {
      if (socketPrint && socketPrint.readyState === socketPrint.OPEN) {
        const data = JSON.stringify({
            acction: 'emit',
            sucursal: sucursal.name,
            data: dataSend
        });
        socketPrint.send(data);
      }
    } catch (error) {
      console.log(error);
      if (error.response && error.response.data) {
          showAlert("red", error.response.data.body.message);
      }
      else {
          showAlert("red", 'Ocurrió algún error interno.');
      }
    }
  };

  return (
    <div className="takeTurn-container">
      {sucursal ? (<>
        <div className="takeTurn-header">
          <h1 className="takeTurn-title">Hola bienvenido a:</h1>
          <img className="takeTurn-logo" src={logo} alt="logo"></img>
          <span className="takeTurn-sucursal">{sucursal.name}</span>
        </div><div className="takeTurn-body">
            <h3 className="takeTurn-subTitle">Tome su turno</h3>
            <div className="takeTurn-buttons">
              {areas.map((object, i) => <div key={i} className="takeTurn-button" onClick={() => takeTurn(object.area)}>{object.area}</div>)}
            </div>
          </div><div className="takeTurn-footer">
            <h2>Tome su turno del area donde desea ser atendido.</h2>
          </div></>) : 
        (<><div className="takeTurn-empty-header">
          <h1>Sucursal inexistente.</h1>
         </div>
         <div className="takeTurn-empty-body">
          <img className="takeTurn-logo" src={logo} alt="logo"></img>
         </div>
         </>)}
    </div>
  );
}

export default TakeTurn;