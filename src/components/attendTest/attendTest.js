import { useState, useEffect, useContext } from "react";
import { DataGrid, esES } from '@mui/x-data-grid';
import axios from "axios";
import moment from "moment";
import socketIOClient from "socket.io-client";
import AppContext from "../../context/app/app-context";
import AttendMenu from "../attendTurn/menu/menu";
import Attend from "../attendTurn/attend/attend";
import logo from '../../public/img/logo.png';
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
                    // const sucursal = props.match.params.suc;
                    handlerAttendTurn(turn);
               }}>
                   Llamar a toma
               </div>  
        ),},
    ];

    const { showAlert, setModule, module } = useContext(AppContext);
    const [sucursalExist, setSucursalExist] = useState(false);

    const [sucursal, setSucursal] = useState('');
    const [modulo, setModulo] = useState('');

    const [dateState, setDateState] = useState(moment());
    const [socket, setSocket] = useState(null);
    const [turns, setTurns] = useState([]);
    const [trace, setTrace] = useState([]);
    const [currentTurn, setCurrentTurn] = useState({
        turn:''
    });
    const [socketTurns, setSocketTurns] = useState({
        status: false,
        action: '',
        data: null
    });
    const [configSucursal, setConfigSucursal] = useState({
        color: '#fff'
      });

    useEffect(() => {
        async function init() {
            try {
                const suc = window.atob(props.match.params.suc);
                const mod = window.atob(props.match.params.module);
                setSucursal(suc);
                setModulo(mod);
                if (await callGetSucursal(suc, mod)) {
                    await getConfigSucursal(suc);
                    await getModule(suc, mod);
                    await getTurns(suc, mod);
                    await getTrace(suc);
                    await getCurrentTurn(suc, mod);
                    const auxSocket = socketIOClient(ENDPOINT);
                    setSocket(auxSocket);
                    auxSocket.emit('join-sucursal', suc);
                    auxSocket.emit('join-type', {sucursal:suc, type:'toma', name:modulo, username: ''});
    
                    auxSocket.on('newTurnTest', data => {
                        if (data) {
                            setSocketTurns({ status: true, action: 'addTurn', data: data });   
                        }
                    });
    
                    auxSocket.on('attendTurnTest', data => {
                        if (data) {
                            setSocketTurns({ status: true, action: 'removeTurn', data: data });   
                        }
                    });
                }

                setInterval(() => setDateState(moment()), 1000);
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
        
        init();
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (socketTurns.status && socketTurns.data !== null) {
            setSocketTurns({ status: false, action: '', data: null });
            if (socketTurns.action === 'addTurn') {
                const auxShifts = [...turns];
                auxShifts.push({
                    id: socketTurns.data.turn._id,
                    turn: socketTurns.data.turn.turn,
                    area: socketTurns.data.turn.area,
                    creationDate: moment(socketTurns.data.turn.creationDate).format("YYYY-MM-DD HH:mm:ss"),
                    state: socketTurns.data.turn.state,
                    sucursal: socketTurns.data.turn.sucursal,
                    call: socketTurns.data.turn.turn
                });
                setTurns(auxShifts);

                const auxTrace = [...trace];
                auxTrace.push(socketTurns.data.trace);
                setTrace(auxTrace);
            }
            else if (socketTurns.action === 'removeTurn') {
                const auxShifts = turns.filter(t => t.turn !== socketTurns.data.turn.turn);
                setTurns(auxShifts);

                const auxTraces = [...trace];
                const auxTrace = auxTraces.filter(t => t.turn !== socketTurns.data.trace.turn);
                setTrace(auxTrace);
            }
        }
    }, [socketTurns]);// eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (configSucursal.timeLimit) {
            const result = trace.filter(r => r.finalDate === undefined && 
                r.state === 'espera toma' && 
                moment(r.startDate).add(configSucursal.timeLimit, 'minutes') < moment());

            if (result.length) {
                const copyTurns = [...turns]; 
                for (let index = 0; index < result.length; index++) {
                    const element = result[index];

                    for (let j = 0; j < copyTurns.length; j++) {
                        const t = {...copyTurns[j]};
                        if (t.turn === element.turn) {
                            t.limit = true;
                            copyTurns[j] = t;
                        }
                    }

                }

                setTurns(copyTurns);
            }  
        }
         
    }, [dateState]);// eslint-disable-line react-hooks/exhaustive-deps

    const callGetSucursal = async (suc, mod) => {
        try {
          const res = await axios.get(`http://localhost:4000/api/modules?sucursal=${suc}|eq&name=${mod}|eq|and`, {
            headers: {
                'me': ''
            }
          });
          const exist = res.data.body.length === 1;
          setSucursalExist(exist);
          return exist;
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

    const getConfigSucursal = async (suc) => {
        try {
            const urlApi = `http://localhost:4000/api/sucursal`;
            const res = await axios.get(urlApi, { 
                headers: {
                    'me': ''
                }
            });
    
            setConfigSucursal(res.data.body.find(s => s.name === suc));
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

    const handlerAttendTurn = async (shift) => {
        if (module && !module.status) {
            try {
                const data = {
                    turn: shift,
                    sucursal: sucursal,
                    ubication: modulo
                };
        
                const res = await axios.post(`http://localhost:4000/api/action/assistance`, data);
    
                const turn = {...res.data.body.turn, ubication: modulo};
                setCurrentTurn(turn);

                const auxShifts = turns.filter(t => t.turn !== shift);
                setTurns(auxShifts);
    
                if (socket) {
                    const data = {...res.data.body, ubication: modulo};
                    socket.emit('attendTurnTest', { sucursal: sucursal, type:'toma', data: data });
                    socket.emit('turnAttend', { sucursal: sucursal, data: data });
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
                    showAlert("red", error.message);
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
                const data = {
                    turn: currentTurn.turn,
                    sucursal: sucursal,
                    ubication: modulo
                };
            
                const res = await axios.post(`http://localhost:4000/api/action/recall`, data, { 
                    headers: { 'me': '' }
                });
                
                showAlert("blue", `Ha re-llamado a: ${currentTurn.turn}`); 
        
                if (socket) {
                    const turn = {...res.data.body, ubication: modulo};
                    socket.emit('turnReCall', { sucursal: sucursal, data: turn });
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
        }
        else {
            showAlert("yellow", 'No puede re-llamar un turno hasta actualizar el estado del modulo a "true".');
        }
    }
    
    const handlerCancelationTurn = async () => {
        if (module && module.status) {
            try {
                const data = {
                    turn: currentTurn.turn,
                    sucursal: sucursal,
                    ubication: modulo
                };
            
                const res = await axios.post(`http://localhost:4000/api/action/cancelation`, data);
                setCurrentTurn({turn: ''});
        
                if (socket) {
                    const turn = {...res.data.body, ubication: modulo};
                    socket.emit('turnFinish', { sucursal: sucursal, data: turn });
                }

                const auxTraces = [...trace];
                const auxTrace = auxTraces.filter(t => t.turn !== res.data.body.trace.turn);
                setTrace(auxTrace);

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
                    showAlert("red", error.message);
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
                const data = {
                    turn: currentTurn.turn,
                    sucursal: sucursal,
                    ubication: modulo
                };
            
                const res = await axios.post(`http://localhost:4000/api/action/finished`, data);
        
                setCurrentTurn({turn: ''});

                if (socket) {
                    const turn = {...res.data.body, ubication: modulo};
                    socket.emit('turnFinish', { sucursal: sucursal, data: turn });
                }

                const auxTraces = [...trace];
                const auxTrace = auxTraces.filter(t => t.turn !== res.data.body.trace.turn);
                setTrace(auxTrace);

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
                    showAlert("red", error.message);
                }
            } 
        }
        else {
            showAlert("yellow", 'No puede terminar de atender un turno hasta actualizar el estado del modulo a "true".');
        }
    }

    const getTurns = async (suc, mod, url = '') => {
        try {
            const urlTurns = `http://localhost:4000/api/action/attended/${suc}`;
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
                showAlert("red", error.message);
            }
        }
    }

    const getTrace = async (suc) => {
        try {
            const res = await axios.get(`http://localhost:4000/api/trace?sucursal=${suc}|eq&state=espera toma|eq|and&finalDate=null|eq|and`, {
                headers: {
                    'me': ''
                }
            });

            const rows = [];
            res.data.body.forEach(row => {
                rows.push({
                    id: row._id,
                    turn: row.turn,
                    startDate: moment(row.startDate).format("YYYY-MM-DD HH:mm:ss"),
                    ubication: row.ubication,
                    state: row.state,
                    sucursal: row.sucursal
                });
            });

            setTrace(rows);
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

    const getModule = async (suc, mod) => {
        try {
            const auxModule = await axios.get(`http://localhost:4000/api/modules/${mod}/${suc}`);
            setModule(auxModule.data.body);
        } catch (error) {
            console.log(error);
            if (error.response && error.response.status === 404) {
                showAlert("red", "Módulo no encontrado.");
            }
            else {
                showAlert("red", error.message);
            }
        }
    };

    const getCurrentTurn = async (suc, mod) => {
        try {
            const res = await axios.get(`http://localhost:4000/api/trace?ubication=${mod}|eq&sucursal=${suc}|eq|and&finalDate=null|eq|and`,{ 
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
                showAlert("red", error.message);
            }
        }
    };

    return (
        // <h1>{props.match.params.suc}-{props.match.params.area}</h1>
        <div className="attendTest-container">
            {sucursalExist ?
                <><AttendMenu isModuleFree={true} sucursal={sucursal} module={modulo} configSuc={configSucursal}/>
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
                            getRowClassName={(params) => {
                                return params.row.limit && params.row.state === 'espera toma' ? `super-app-theme ` : '';
                            }}
                        />
                    </div>
            </div> :
            <div className="message">
                <h1 className="title">Módulo no disponible.</h1>
            </div>
            }</>  : <>
                <div className="takeTurn-empty-header">
                    <h1>Módulo inexistente.</h1>
                </div>
                <div className="takeTurn-empty-body">
                    <img className="takeTurn-logo" src={logo} alt="logo"></img>
                </div>
            </>}
        </div>
    );
}

export default AttendTest;