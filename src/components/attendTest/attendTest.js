import { useState, useEffect, useContext } from "react";
import { DataGrid, esES } from '@mui/x-data-grid';
import axios from "axios";
import moment from "moment";
import socketIOClient from "socket.io-client";
import AppContext from "../../context/app/app-context";
import AttendMenu from "../attendTurn/menu/menu";
import Attend from "../attendTurn/attend/attend";
import "./styles.css";

function AttendTest(props) {
    const ENDPOINT = `http://localhost:4000`;
    const columnsTurns = [
        { field: 'turn', headerName: 'Turno', flex: 1, mytype: 'string' },
        { field: 'area', headerName: 'Area', flex: 1, mytype: 'string' },
        { field: 'sucursal', headerName: 'Sucursal', flex: 1, mytype: 'string' },
        { field: 'state', headerName: 'Estado', flex: 1, mytype: 'number' },
        { field: 'creationDate', headerName: 'Fecha creación', flex: 1, mytype: 'string' },
        { field: 'call', headerName: 'Atender', flex: 1,
            renderCell: (params) => (
                <div className="button-associate" onClick={async () => {
                    const turn = params.value;
                    const sucursal = props.match.params.suc;
                    handlerAttendTurn(turn);
                    console.log(turn + '-' + sucursal);
               }}>
                   Llamar a toma
               </div>  
        ),},
    ];

    const { showAlert, setModule, module } = useContext(AppContext);
    const [socket, setSocket] = useState(null);
    const [turns, setTurns] = useState([]);
    const [currentTurn, setCurrentTurn] = useState({
        turn:''
    });
    const [socketTurns, setSocketTurns] = useState({
        status: false,
        action: '',
        data: null
    });

    useEffect(() => {
        const sucursal = window.atob(props.match.params.suc);
        const module = window.atob(props.match.params.module);
        getModule();
        getTurns();
        getCurrentTurn();
        const auxSocket = socketIOClient(ENDPOINT);
        setSocket(auxSocket);
        auxSocket.emit('join-sucursal', sucursal);
        auxSocket.emit('join-type', {sucursal:sucursal, type:'toma', name:module, username: ''});

        auxSocket.on('newTurnTest', data => {
            if (data) {
                setSocketTurns({ status: true, action: 'addTurn', data: data.turn });   
            }
        });

        auxSocket.on('attendTurnTest', data => {
            if (data) {
                setSocketTurns({ status: true, action: 'removeTurn', data: data.turn });   
            }
        });
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (socketTurns.status && socketTurns.data !== null) {
            setSocketTurns({ status: false, action: '', data: null });
            if (socketTurns.action === 'addTurn') {
                const auxShifts = [...turns];
                auxShifts.push({
                    id: socketTurns.data._id,
                    turn: socketTurns.data.turn,
                    area: socketTurns.data.area,
                    creationDate: moment(socketTurns.data.creationDate).format("YYYY-MM-DD HH:mm:ss"),
                    state: socketTurns.data.state,
                    sucursal: socketTurns.data.sucursal,
                    call: socketTurns.data.turn
                });
                setTurns(auxShifts);
            }
            else if (socketTurns.action === 'removeTurn') {
                const auxShifts = turns.filter(t => t.turn !== socketTurns.data.turn);
                setTurns(auxShifts);
            }
        }
    }, [socketTurns]);// eslint-disable-line react-hooks/exhaustive-deps

    const handlerAttendTurn = async (shift) => {
        if (module && !module.status) {
            try {
                const sucursal = window.atob(props.match.params.suc);
                const module = window.atob(props.match.params.module);
                const data = {
                    turn: shift,
                    sucursal: sucursal,
                    ubication: module
                };
        
                const res = await axios.post(`http://localhost:4000/api/action/assistance`, data);
    
                const turn = {...res.data.body, ubication: module};
                setCurrentTurn(turn);

                const auxShifts = turns.filter(t => t.turn !== shift);
                setTurns(auxShifts);
    
                if (socket) {
                    socket.emit('attendTurnTest', { sucursal: sucursal, type:'toma', data: turn });
                    socket.emit('turnAttend', { sucursal: sucursal, data: turn });
                }
        
                const auxModule = {...module};
                auxModule.status = true;
                setModule(auxModule);
            } catch (error) {
                if (error.response && error.response.data) {
                    console.log(error.response.data);
                    // showAlert("red", error.response.data.body.message); 
                }
                else {
                    console.log(error);
                    showAlert("red", 'Ocurrio algun error interno.');
                }
            } 
        }
        else {
            showAlert("yellow", 'No puede solicitar otro turno hasta terminar de atender al actual.');
        }
    }
    
    const handlerReCallTurn = async () => {
        if (module && module.status) {
            try {
                const sucursal = window.atob(props.match.params.suc);
                const module = window.atob(props.match.params.module);
                const data = {
                    turn: currentTurn.turn,
                    sucursal: sucursal,
                    ubication: module
                };
            
                const res = await axios.post(`http://localhost:4000/api/action/recall`, data, { 
                    headers: { 'me': '' }
                });
                
                showAlert("blue", `Ha re-llamado a: ${currentTurn.turn}`); 
        
                if (socket) {
                    const turn = {...res.data.body, ubication: module};
                    socket.emit('turnReCall', { sucursal: sucursal, data: turn });
                }
            } catch (error) {
                if (error.response && error.response.data) {
                    console.log(error.response.data);
                    showAlert("red", error.response.data.body.message); 
                }
                else {
                    console.log(error);
                    showAlert("red", 'Ocurrio algun error interno.');
                }
            } 
        }
        else {
            showAlert("yellow", 'No puede re-llamar un turno hasta actualizar el estado del modulo a "true".');
        }
    }
    
    const handlerCancelationTurn = async () => {
        if (module && module.status) {
            try {
                const sucursal = window.atob(props.match.params.suc);
                const module = window.atob(props.match.params.module);
                const data = {
                    turn: currentTurn.turn,
                    sucursal: sucursal,
                    ubication: module
                };
            
                const res = await axios.post(`http://localhost:4000/api/action/cancelation`, data);
                setCurrentTurn({turn: ''});
        
                if (socket) {
                    const turn = {...res.data.body, ubication: module};
                    socket.emit('turnFinish', { sucursal: sucursal, data: turn });
                }

                const auxModule = {...module};
                auxModule.status = false;
                setModule(auxModule);
            } catch (error) {
                if (error.response && error.response.data) {
                    console.log(error.response.data);
                    showAlert("red", error.response.data.body.message); 
                }
                else {
                    console.log(error);
                    showAlert("red", 'Ocurrio algun error interno.');
                }
            } 
        }
        else {
            showAlert("yellow", 'No puede cancelar un turno hasta actualizar el estado del modulo a "true".');
        }
    }
    
    const handlerAttendedTurn = async () => {
        if (module && module.status) {
            try {
                const sucursal = window.atob(props.match.params.suc);
                const moduleParam = window.atob(props.match.params.module);
                const data = {
                    turn: currentTurn.turn,
                    sucursal: sucursal,
                    ubication: moduleParam
                };
            
                const res = await axios.post(`http://localhost:4000/api/action/finished`, data);
        
                setCurrentTurn({turn: ''});

                if (socket) {
                    const turn = {...res.data.body, ubication: moduleParam};
                    socket.emit('turnFinish', { sucursal: sucursal, data: turn });
                }

                const auxModule = {...module};
                auxModule.status = false;
                setModule(auxModule);
            } catch (error) {
                if (error.response && error.response.data) {
                    console.log(error.response.data);
                    showAlert("red", error.response.data.body.message); 
                }
                else {
                    console.log(error);
                    showAlert("red", 'Ocurrio algun error interno.');
                }
            } 
        }
        else {
            showAlert("yellow", 'No puede terminar de atender un turno hasta actualizar el estado del modulo a "true".');
        }
    }

    const getTurns = async (url = '') => {
        try {
            const sucursal = window.atob(props.match.params.suc);
            const urlTurns = `http://localhost:4000/api/action/attended/${sucursal}`;
            const urlApi = url !== '' ? url : urlTurns;
            const res = await axios.get(urlApi);

            const rows = [];
            res.data.body.forEach(row => {
                rows.push({
                    id: row._id,
                    turn: row.turn,
                    area: row.area,
                    creationDate: moment(row.creationDate).format("YYYY-MM-DD HH:mm:ss"),
                    state: row.state,
                    sucursal: row.sucursal,
                    call: row.turn
                });
            });

            setTurns(rows);
        } catch (error) {
            if (error.response && error.response.data) {
                console.log(error.response.data);
                showAlert("red", error.response.data.body.message); 
            }
            else {
                console.log(error);
                showAlert("red", 'Ocurrio algun error interno.');
            }
        }
    }

    const getModule = async () => {
        try {
            const sucursal = props.match.params.suc;
            const module = props.match.params.module;
            const auxModule = await axios.get(`http://localhost:4000/api/modules/${window.atob(module)}/${window.atob(sucursal)}`);
            setModule(auxModule.data.body);
        } catch (error) {
            console.log(error);
            if (error.response && error.response.status === 404) {
                // showAlert("red", "Módulo no encontrado.");
            }
            else {
                showAlert("red", "Ocurrio algún error.");
            }
        }
    };

    const getCurrentTurn = async () => {
        try {
            const sucursal = window.atob(props.match.params.suc);
            const module = window.atob(props.match.params.module);
            const res = await axios.get(`http://localhost:4000/api/trace?ubication=${module}|eq&sucursal=${sucursal}|eq|and&finalDate=null|eq|and`,{ 
                headers: { 'me': '' }
            });

            const auxModule = {...module};
            if (res && res.data.body.length) {
                setCurrentTurn(res.data.body[0]);
                auxModule.status = true;
            }
            else {
                setCurrentTurn({turn: ''});
                auxModule.status = false;
            }

            setModule(auxModule);
        } catch (error) {
            console.log(error);
            if (error.response && error.response.status === 404) {
                showAlert("red", "Módulo no encontrado.");
            }
            else {
                showAlert("red", "Ocurrio algún error.");
            }
        }
    };

    return (
        // <h1>{props.match.params.suc}-{props.match.params.area}</h1>
        <div className="attendTest-container">
            <AttendMenu isModuleFree={true}/>
            {module ? <div className="attendTest-content">
                <Attend currentTurn={currentTurn} isModuleFree={true}
                        handlerAttendedTurn={handlerAttendedTurn}
                        handlerCancelationTurn={handlerCancelationTurn}
                        handlerReCallTurn={handlerReCallTurn}/>
                <div className="attendTest-body">
                    <DataGrid
                        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                        rows={turns}
                        columns={columnsTurns}
                        pageSize={10}
                        rowsPerPageOptions={[10]}
                        disableSelectionOnClick
                        onSelectionModelChange={(ids) => {
                            console.log(ids[0]);
                        }}
                    />
                </div>
          </div> :
          <div className="message">
              <h1 className="title">Módulo no disponible.</h1>
          </div>
          }  
        </div>
    );
}

export default AttendTest;