import { useState, useEffect, useContext } from "react";
import { useForm, Controller  } from "react-hook-form";
import { DataGrid, esES } from '@mui/x-data-grid';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import axios from "axios";
import moment from "moment";
import socketIOClient from "socket.io-client";
import AppContext from "../../context/app/app-context";
import AttendMenu from "../attendTurn/menu/menu";
// import Attend from "../attendTurn/attend/attend";
import logo from '../../public/img/logo.png';
import { AiOutlineClose } from "react-icons/ai";
import { GoMegaphone } from "react-icons/go";
import { FiCheck } from "react-icons/fi";
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
                printButtons(params.value)
        ),},
    ];

    const { control, handleSubmit, setValue, formState: { errors } } = useForm({defaultValues: {
        idExakta: ''
    }});
    const onSubmit = data => updateTurnAndTrace(data);

    const { showAlert, setModule, module } = useContext(AppContext);
    const [sucursalExist, setSucursalExist] = useState(false);

    const [sucursal, setSucursal] = useState('');
    const [modulo, setModulo] = useState('');
    const [openDialog, setOpenDialog] = useState(false);

    const [selectedTurn, setSelectedTurn] = useState(null);
    const [dateState, setDateState] = useState(moment());
    const [socket, setSocket] = useState(null);
    const [turns, setTurns] = useState([]);
    const [trace, setTrace] = useState([]);
    // const [currentTurn, setCurrentTurn] = useState({
    //     turn:''
    // });
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
                    // await getCurrentTurn(suc, mod);
                    const auxSocket = socketIOClient(ENDPOINT);
                    setSocket(auxSocket);
                    auxSocket.emit('join-sucursal', suc);
                    auxSocket.emit('join-type', {sucursal:suc, type:'toma', name:modulo, username: ''});
    
                    auxSocket.on('newTurnTest', data => {
                        if (data) {
                            console.log(data);
                            setSocketTurns({ status: true, action: 'addTurn', data: data });   
                        }
                    });
    
                    auxSocket.on('attendTurnTest', data => {
                        if (data) {
                            console.log(data);
                            setSocketTurns({ status: true, action: 'attendTurn', data: data });   
                        }
                    });

                    auxSocket.on('turnFinish', data => {
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
                    call: socketTurns.data.turn
                });
                setTurns(auxShifts);

                const auxTrace = [...trace];
                auxTrace.push(socketTurns.data.trace);
                setTrace(auxTrace);
            }
            else if (socketTurns.action === 'attendTurn') {
                const auxShifts = [...turns];
                for (let index = 0; index < auxShifts.length; index++) {
                    let t = {...auxShifts[index]};
                    if (t.turn === socketTurns.data.turn.turn) {
                        auxShifts[index] = {...socketTurns.data.turn, id: socketTurns.data.turn._id, call: socketTurns.data.turn};
                    }
                }
                setTurns(auxShifts);

                const auxTraces = [...trace];
                for (let index = 0; index < auxTraces.length; index++) {
                    let t = {...auxTraces[index]};
                    if (t.turn === socketTurns.data.turn.turn) {
                        auxTraces[index] = socketTurns.data.trace;
                    }
                }
                setTrace(auxTraces);
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

    const printButtons = (data) => {
        let buttons = <></>;
        const turn = data.turn;
        switch (data.state) {
            case 'espera toma':
                buttons = <Tooltip title="Atender turno"><div className="button-associate" onClick={async () => {
                    handleOpenDialog(turn, 'toma');
               }}><GoMegaphone size={15}/></div></Tooltip>;
                break;
            case 'en toma':
                buttons = <>
                    <Tooltip title="Rellamar"><div className="button-associate blues" onClick={async () => {
                        handleOpenDialog(turn, 're-call');
                    }}><GoMegaphone size={15}/></div></Tooltip>
                    <Tooltip title="Cancelar"><div className="button-associate red" onClick={async () => {
                        handleOpenDialog(turn, 'cancelar');
                    }}><AiOutlineClose size={15}/></div></Tooltip>
                    <Tooltip title="Terminar"><div className="button-associate green" onClick={async () => {
                        handleOpenDialog(turn, 'terminar');
                    }}><FiCheck size={15}/></div></Tooltip>
                </>;
                break;
            case 're-call':
                buttons = <>
                    <Tooltip title="Rellamar"><div className="button-associate blues" onClick={async () => {
                        handleOpenDialog(turn, 're-call');
                    }}><GoMegaphone size={15}/></div></Tooltip>
                    <Tooltip title="Cancelar"><div className="button-associate red" onClick={async () => {
                        handleOpenDialog(turn, 'cancelar');
                    }}><AiOutlineClose size={15}/></div></Tooltip>
                    <Tooltip title="Terminar"><div className="button-associate green" onClick={async () => {
                        handleOpenDialog(turn, 'terminar');
                    }}><FiCheck size={15}/></div></Tooltip>
                </>;
                break;
            case 'pausa':
        
                break;
            default:
                break;
        }

        return buttons;
    }

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

    const handlerAttendTurn = async (idExakta) => {
        try {
            const shift = selectedTurn.turn;
            const data = {
                turn: shift,
                sucursal: sucursal,
                ubication: modulo,
                username: idExakta
            };

            console.log(data);
    
            const res = await axios.post(`http://localhost:4000/api/action/assistance`, data);

            // const turn = {...res.data.body.turn, ubication: modulo};
            // setCurrentTurn(turn);

            // const auxShifts = turns.filter(t => t.turn !== shift);
            // setTurns(auxShifts);

            const auxShifts = [...turns];
            for (let index = 0; index < auxShifts.length; index++) {
                let t = {...auxShifts[index]};
                if (t.turn === shift) {
                    auxShifts[index] = {...res.data.body.turn, id:res.data.body.turn._id, call: res.data.body.turn};
                }
            }
            setTurns(auxShifts);

            const auxTraces = [...trace];
            for (let index = 0; index < auxTraces.length; index++) {
                let t = {...auxTraces[index]};
                if (t.turn === shift) {
                    auxTraces[index] = res.data.body.trace;
                }
            }
            setTrace(auxTraces);

            if (socket) {
                const data = {...res.data.body, ubication: modulo};
                socket.emit('attendTurnTest', { sucursal: sucursal, type:'toma', data: data });
                socket.emit('turnAttend', { sucursal: sucursal, data: data });
            }
    
            // const auxModule = {...module};
            // auxModule.status = true;
            // setModule(auxModule);

            setOpenDialog(false);
            setSelectedTurn(null);
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
    
    const handlerReCallTurn = async (idExakta) => {
        try {
            const shift = selectedTurn.turn;
            const data = {
                turn: shift,
                sucursal: sucursal,
                ubication: modulo,
                username: idExakta
            };
        
            const res = await axios.post(`http://localhost:4000/api/action/recall`, data, { 
                headers: { 'me': '' }
            });
            
            showAlert("blue", `Ha re-llamado a: ${shift}`); 
    
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
    
    const handlerCancelationTurn = async (idExakta) => {
        try {
            const shift = selectedTurn.turn;
            const data = {
                turn: shift,
                sucursal: sucursal,
                ubication: modulo,
                username: idExakta
            };
        
            const res = await axios.post(`http://localhost:4000/api/action/cancelation`, data);
            // setCurrentTurn({turn: ''});
    
            if (socket) {
                const turn = {...res.data.body, ubication: modulo};
                socket.emit('turnFinish', { sucursal: sucursal, data: turn });
            }

            const auxShifts = turns.filter(t => t.turn !== res.data.body.turn.turn);
            setTurns(auxShifts);

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
    
    const handlerAttendedTurn = async (idExakta) => {
        try {
            const shift = selectedTurn.turn;
            const data = {
                turn: shift,
                sucursal: sucursal,
                ubication: modulo,
                username: idExakta
            };
        
            const res = await axios.post(`http://localhost:4000/api/action/finished`, data);
    
            // setCurrentTurn({turn: ''});

            if (socket) {
                const turn = {...res.data.body, ubication: modulo};
                socket.emit('turnFinish', { sucursal: sucursal, data: turn });
            }


            const auxShifts = turns.filter(t => t.turn !== res.data.body.turn.turn);
            setTurns(auxShifts);

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
                    call: row
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

    // const getCurrentTurn = async (suc, mod) => {
    //     try {
    //         const res = await axios.get(`http://localhost:4000/api/trace?ubication=${mod}|eq&sucursal=${suc}|eq|and&finalDate=null|eq|and`,{ 
    //             headers: { 'me': '' }
    //         });

    //         const auxModule = {...module};
    //         if (res && res.data.body.length) {
    //             setCurrentTurn(res.data.body[0]);
    //             auxModule.status = true;
    //         }
    //         else {
    //             setCurrentTurn({turn: ''});
    //             auxModule.status = false;
    //         }

    //         setModule(auxModule);
    //     } catch (error) {
    //         console.log(error);
    //         if (error.response && error.response.status === 404) {
    //             showAlert("red", "Módulo no encontrado.");
    //         }
    //         else {
    //             showAlert("red", error.message);
    //         }
    //     }
    // };

    const validIdExakta = async (id, isNew = false) => {
        try {
            const res = await axios.get(`http://localhost:4000/api/users?username=${id}|eq`, {
                headers: {
                    'me': ''
                }
            });

            let exist = false;
            if (res.data.body.length) { 
                if (res.data.body[0].rol.toLowerCase() === 'tomador') {
                    const resTrace = await axios.get(`http://localhost:4000/api/trace?username=${id}|eq&finalDate=null|eq|and`, {
                        headers: {
                            'me': ''
                        }
                    });

                    if (isNew) {
                        if (resTrace.data.body.length === 0) {
                            exist = true;
                        }
                        else {
                            throw new Error('Aun tiene pacientes pendientes.');
                        }
                    }
                    else {
                        if (resTrace.data.body.length > 0) {
                            if (resTrace.data.body[0].username === id) {
                                exist = true;
                            }
                            else {
                                throw new Error(`El idExakta: ${id} no es el quien inicio la atención.`);
                            }
                        }
                        else {
                            throw new Error('No tiene pacientes pendientes.');
                        }
                    }
                }
                else {
                    throw new Error('IdExakta no corresponde a un tomador de muestras.');
                }
            }
            else {
                throw new Error('IdExakta inexistente.');
            }

            return exist;
        } catch (error) {
            console.log(error);
            if (error.response && error.response.status === 404) {
                showAlert("red", error.response.message);
            }
            else {
                showAlert("red", error.message);
            }
        }
    }

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedTurn(null);
        setValue('idExakta', '', {
            shouldValidate: false,
        });
    };

    const handleOpenDialog = (turn, action) => {
        setOpenDialog(true);
        setSelectedTurn({turn, action});
    };

    const updateTurnAndTrace = async(data) => {
        

        if (selectedTurn && selectedTurn.action === 'toma') {
            const res = await validIdExakta(data.idExakta, true);
            if (res) {
                handleCloseDialog();
                handlerAttendTurn(data.idExakta);
            }
            else {
                showAlert("yellow", "IdExakta no tiene rol de tomador de muestras.");
            }
        }
        else if (selectedTurn && selectedTurn.action === 're-call') {
            const res = await validIdExakta(data.idExakta);
            if (res) {
                handleCloseDialog();
                handlerReCallTurn(data.idExakta);
            }
            else {
                showAlert("yellow", "IdExakta no coincide conquien realizo la toma.");
            }
        }
        else if (selectedTurn && selectedTurn.action === 'cancelar') {
            const res = await validIdExakta(data.idExakta);
            if (res) {
                handleCloseDialog();
                handlerCancelationTurn(data.idExakta);
            }
            else {
                showAlert("yellow", "IdExakta no coincide conquien realizo la toma");
            }
        }
        else if (selectedTurn && selectedTurn.action === 'terminar') {
            const res = await validIdExakta(data.idExakta);
            if (res) {
                handleCloseDialog();
                handlerAttendedTurn(data.idExakta);
            }
            else {
                showAlert("yellow", "IdExakta no coincide conquien realizo la toma");
            }
        }
    }

    return (<>
        <div className="attendTest-container">
            {sucursalExist ?
                <><AttendMenu isModuleFree={true} sucursal={sucursal} module={modulo} configSuc={configSucursal}/>
                {module ? <div className="attendTest-content">
                    {/* <Attend currentTurn={currentTurn} isModuleFree={true}
                            handlerAttendedTurn={handlerAttendedTurn}
                            handlerCancelationTurn={handlerCancelationTurn}
                            handlerReCallTurn={handlerReCallTurn}/> */}
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
        
        <Dialog open={openDialog} onClose={handleCloseDialog}>
            <DialogTitle>IdExakta</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)} className='formDialog'>
            <DialogContent>
                <Controller
                    name="idExakta"
                    control={control}
                    render={({ field }) => <TextField
                            error={errors.idExakta?.type === 'required'}
                            helperText={errors.idExakta ? 'Campo obligatorio.' : ''}                            
                            autoFocus
                            margin="dense"
                            id="idExakta"
                            label="idExakta"
                            type="text"
                            fullWidth
                            variant="standard"
                            {...field}
                    />}
                    rules={{ required: true }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseDialog}>Cancelar</Button>
                <Button type="submit" >Aceptar</Button>
            </DialogActions>
            </form>
        </Dialog>
    </>);
}

export default AttendTest;