import { useEffect, useState, useContext } from "react";
import socketIOClient from "socket.io-client";
import axios from 'axios';
import AppContext from "../../context/app/app-context";
import './styles.css';
import logo from '../../public/img/logo.png';
const W3CWebSocket = require('websocket').w3cwebsocket;

function TakeTurn(props) {
  const ENDPOINT = `http://localhost:4000`;
  const [socket, setSocket] = useState(null);
  const [socketPrint, setSocketPrint] = useState(null);
  const [sucursal, setSucursal] = useState('');
  const { showAlert } = useContext(AppContext);
  const [areas, setAreas] = useState([]);
  const [sucursalExist, setSucursalExist] = useState(false);

  useEffect(() => {
    try {
      const suc = window.atob(props.match.params.suc);
      setSucursal(suc);
      setSocket(socketIOClient(ENDPOINT));
      const client = new W3CWebSocket('ws://localhost:7000/');
      client.onopen = function() {
          if (client.readyState === client.OPEN) {
            setSocketPrint(client);   
          }
      };
      callGetSucursal(suc); 
    } catch (error) {
      if (error.response && error.response.data) {
        console.log(error.response.data);
        showAlert("red", error.response.data.body.message); 
      }
      else {
          console.log(error);
          showAlert("red", error.message);
      }
    }
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  const sendPrint = (dataSend) => {
    try {
      if (socketPrint && socketPrint.readyState === socketPrint.OPEN) {
        const data = JSON.stringify({
            acction: 'emit',
            sucursal: sucursal,
            data: dataSend
        });
        socketPrint.send(data);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        console.log(error.response.data);
        showAlert("red", error.response.data.body.message); 
      }
      else {
          console.log(error);
          showAlert("red", error.message);
      }
    }
  };

  const callGetAreas = async (suc) => {
    try {
      const res = await axios.get(`http://localhost:4000/api/area-sucursal/${suc}`);
      setAreas(res.data.body); 
    } catch (error) {
      throw error;
    }
  };

  const callGetSucursal = async (suc) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/sucursal/${suc}`);
      if (res.data.statusCode === 200) {
        setSucursalExist(true);
        callGetAreas(suc);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        console.log(error.response.data);
        showAlert("red", error.response.data.body.message); 
      }
      else {
        console.log(error);
        showAlert("red", error.message);
      }
    }
    
  };

  const takeTurn = async (area) => {
    try {
      const data = {
        area: area,
        sucursal: sucursal
      };
      const res = await axios.post(`http://localhost:4000/api/action/take`, data, { 
          headers: {
              'auth': localStorage.getItem('token')
          }
      });

      socket.emit('newTurn', {sucursal:sucursal, data:res.data.body});
      sendPrint(res.data.body);
      showAlert("green", "Turno creado."); 
    } catch (error) {
        if (error.response && error.response.data) {
            console.log(error.response.data);
            showAlert("red", error.response.data.body.message); 
        }
        else {
            console.log(error);
            showAlert("red", error.message);
        }
    }
  }

  return (
    <div className="takeTurn-container">
      {sucursalExist ? (<>
        <div className="takeTurn-header">
          <h1 className="takeTurn-title">Hola bienvenido a:</h1>
          <img className="takeTurn-logo" src={logo} alt="logo"></img>
          <span className="takeTurn-sucursal">{sucursal}</span>
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