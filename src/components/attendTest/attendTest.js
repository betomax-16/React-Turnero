import { useState, useEffect, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import { FiSearch } from "react-icons/fi";
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import axios from "axios";
import moment from "moment";
import socketIOClient from "socket.io-client";
import AppContext from "../../context/app/app-context";
import AttendMenu from "../attendTurn/menu/menu";
import TurnCard from "./cardTurn/turnCard";
// import Attend from "../attendTurn/attend/attend";
import logo from '../../public/img/logo.png';
import { blue, green, red, orange, purple } from '@mui/material/colors';
import { AiOutlineClose } from "react-icons/ai";
import "./styles.css";

const ButtonGreen = styled(Button)(({ theme }) => ({
    color: theme.palette.getContrastText(purple[500]),
    backgroundColor: green[500],
    '&:hover': {
      backgroundColor: green[700],
    },
}));
const ButtonGreen2 = styled(Button)(({ theme }) => ({
    color: theme.palette.getContrastText(purple[300]),
    backgroundColor: green[300],
    '&:hover': {
      backgroundColor: green[400],
    },
}));
const ButtonBlue = styled(Button)(({ theme }) => ({
    color: theme.palette.getContrastText(purple[500]),
    backgroundColor: blue[500],
    '&:hover': {
      backgroundColor: blue[700],
    },
}));
const ButtonRed = styled(Button)(({ theme }) => ({
    color: theme.palette.getContrastText(purple[500]),
    backgroundColor: red[500],
    '&:hover': {
      backgroundColor: red[700],
    },
}));
const ButtonOrange = styled(Button)(({ theme }) => ({
    color: theme.palette.getContrastText(purple[500]),
    backgroundColor: orange[500],
    '&:hover': {
      backgroundColor: orange[700],
    },
}));

function AttendTest(props) {
    const ENDPOINT = `http://${window.location.hostname}:4000`;

    const { search } = useLocation();
    const query = useMemo(() => new URLSearchParams(search), [search]);
    const { showAlert, setModule, module } = useContext(AppContext);
    const [sucursalExist, setSucursalExist] = useState(false);

    const [sucursal, setSucursal] = useState('');
    const [modulo, setModulo] = useState('');
    const [openDialog, setOpenDialog] = useState(false);

    const [selectedTurn, setSelectedTurn] = useState(null);
    const [dateState, setDateState] = useState(moment());
    const [socket, setSocket] = useState(null);
    // const [turns, setTurns] = useState([]);
    const [trace, setTrace] = useState([]);
    const [area, setArea] = useState(null);
    const [filterLaboratorio, setFilterLab] = useState('');
    const [filterImgen, setFilterImg] = useState('');
    const [idExakta, setIdExakta] = useState({
        value: '',
        error: false
    });
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
                if (query.get('area')) {
                    setArea(query.get('area'));
                }
                const suc = window.atob(props.match.params.suc);
                const mod = window.atob(props.match.params.module);
                setSucursal(suc);
                setModulo(mod);
                if (await callGetSucursal(suc, mod)) {
                    await getConfigSucursal(suc);
                    await getModule(suc, mod);
                    // await getTurns(suc, mod);
                    await getTrace(suc);
                    // await getCurrentTurn(suc, mod);
                    const auxSocket = socketIOClient(ENDPOINT);
                    setSocket(auxSocket);
                    auxSocket.emit('join-sucursal', suc);
                    auxSocket.emit('join-type', {sucursal:suc, type:'toma', name:mod, username: ''});
                    auxSocket.emit('join-module', {sucursal:suc, module:mod});
    
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

                    auxSocket.on('refresh', () => {
                        window.location.reload();
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
                const auxTrace = [...trace];
                const aux = {...socketTurns.data.trace};
                aux.startDate = moment(socketTurns.data.trace.startDate).format("YYYY-MM-DD HH:mm:ss");
                aux.status = 'Libre';
                aux.area = socketTurns.data.turn.area;
                auxTrace.push(aux);
                setTrace(auxTrace);
            }
            else if (socketTurns.action === 'attendTurn') {
                const auxTraces = [...trace];
                for (let index = 0; index < auxTraces.length; index++) {
                    let t = {...auxTraces[index]};
                    let status = 'Libre';
                    if (socketTurns.data.trace.state === 'espera toma') {
                        status = 'Libre';
                    }
                    else if (socketTurns.data.trace.state === 'en toma' || socketTurns.data.trace.state === 're-call') {
                        status = 'Activo';
                    }
                    if (t.turn === socketTurns.data.turn.turn) {
                        auxTraces[index] = socketTurns.data.trace;
                        auxTraces[index].startDate = moment(auxTraces[index].startDate).format("YYYY-MM-DD HH:mm:ss");
                        auxTraces[index].status = status;
                    }
                }
                setTrace(auxTraces);
            }
            else if (socketTurns.action === 'removeTurn') {
                if (!socketTurns.data.type) {
                    const auxTraces = [...trace];
                    const auxTrace = auxTraces.filter(t => t.turn !== socketTurns.data.trace.turn);
                    setTrace(auxTrace);
                }
            }
        }
    }, [socketTurns]);// eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (configSucursal.timeLimit) {
            const auxTrace = [...trace];
            for (let index = 0; index < auxTrace.length; index++) {
                const element = {...auxTrace[index]};
                if (element.finalDate === undefined && element.state === 'espera toma' &&
                    moment(element.startDate).add(configSucursal.timeLimit, 'minutes') < moment()) {
                        element.status = 'Tarde';
                }

                auxTrace[index] = element;
            }

            setTrace(auxTrace);  
        }
         
    }, [dateState]);// eslint-disable-line react-hooks/exhaustive-deps

    const callGetSucursal = async (suc, mod) => {
        try {
          const res = await axios.get(`http://${window.location.hostname}:4000/api/modules?sucursal=${suc}|eq&name=${mod}|eq|and`, {
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
            const urlApi = `http://${window.location.hostname}:4000/api/sucursal`;
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
            const shift = selectedTurn.turn.turn;
            const data = {
                turn: shift,
                sucursal: sucursal,
                ubication: modulo,
                username: idExakta
            };

            console.log(data);
    
            const res = await axios.post(`http://${window.location.hostname}:4000/api/action/assistance`, data);

            // const turn = {...res.data.body.turn, ubication: modulo};
            // setCurrentTurn(turn);

            // const auxShifts = turns.filter(t => t.turn !== shift);
            // setTurns(auxShifts);

            const auxTraces = [...trace];
            for (let index = 0; index < auxTraces.length; index++) {
                let t = {...auxTraces[index]};
                if (t.turn === shift) {
                    auxTraces[index] = res.data.body.trace;
                    auxTraces[index].startDate = moment(auxTraces[index].startDate).format("YYYY-MM-DD HH:mm:ss");
                    auxTraces[index].status = 'Activo';
                    auxTraces[index].area = res.data.body.turn.area;
                }
            }
            console.log(auxTraces);
            setTrace(auxTraces);

            if (socket) {
                const data = {turn:{...res.data.body.turn, ubication: modulo}, trace: {...res.data.body.trace}, ubication: modulo};
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
                showAlert("red", error.response.data.body.message); 
            }
            else {
                console.log(error);
                showAlert("red", error.message);
            }
        }
    }
    
    const handlerReCallTurn = async (idExakta) => {
        try {
            const shift = selectedTurn.turn.turn;
            const data = {
                turn: shift,
                sucursal: sucursal,
                ubication: modulo,
                username: idExakta,
                source: 'toma'
            };
        
            const res = await axios.post(`http://${window.location.hostname}:4000/api/action/recall`, data, { 
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
            const shift = selectedTurn.turn.turn;
            const data = {
                turn: shift,
                sucursal: sucursal,
                ubication: modulo,
                username: idExakta,
                source: 'toma'
            };
        
            const res = await axios.post(`http://${window.location.hostname}:4000/api/action/cancelation`, data);
            // setCurrentTurn({turn: ''});
    
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
    
    const handlerAttendedTurn = async (idExakta) => {
        try {
            const shift = selectedTurn.turn.turn;
            const data = {
                turn: shift,
                sucursal: sucursal,
                ubication: modulo,
                username: idExakta,
                source: 'toma'
            };
        
            const res = await axios.post(`http://${window.location.hostname}:4000/api/action/finished`, data);
    
            // setCurrentTurn({turn: ''});

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

    const handlerFreeTurn = async () => {
        try {
            const shift = selectedTurn.turn.turn;
            const data = {
                turn: shift,
                sucursal: sucursal
            };
        
            const res = await axios.post(`http://${window.location.hostname}:4000/api/action/free`, data);
    
            // setCurrentTurn({turn: ''});

            const auxTraces = [...trace];
            for (let index = 0; index < auxTraces.length; index++) {
                let t = {...auxTraces[index]};
                if (t.turn === shift) {
                    auxTraces[index] = res.data.body.trace;
                    auxTraces[index].startDate = moment(auxTraces[index].startDate).format("YYYY-MM-DD HH:mm:ss");
                    auxTraces[index].status = 'Libre';
                    auxTraces[index].area = res.data.body.turn.area;
                }
            }
            setTrace(auxTraces);

            if (socket) {
                const data = {...res.data.body, ubication: modulo, type: 'freeTurn'};
                socket.emit('attendTurnTest', { sucursal: sucursal, type:'toma', data: data });
                socket.emit('turnFinish', { sucursal: sucursal, data: data });
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
                showAlert("red", error.message);
            }
        } 
    }

    // const getTurns = async (suc) => {
    //     try {
    //         let url = `http://${window.location.hostname}:4000/api/action/attended/${suc}`;
    //         if (query.get('area')) {
    //             url += `?area=${query.get('area')}`;
    //         }
    //         const res = await axios.get(url);

    //         console.log(res);
    //         const rows = [];
    //         res.data.body.forEach(row => {
    //             rows.push({
    //                 id: row._id,
    //                 turn: row.turn,
    //                 area: row.area,
    //                 creationDate: moment(row.creationDate).format("YYYY-MM-DD HH:mm:ss"),
    //                 state: row.state,
    //                 sucursal: row.sucursal,
    //                 call: row
    //             });
    //         });

    //         setTurns(rows);
    //     } catch (error) {
    //         if (error.response && error.response.data) {
    //             console.log(error.response.data);
    //             showAlert("red", error.response.data.body.message); 
    //         }
    //         else {
    //             console.log(error);
    //             showAlert("red", error.message);
    //         }
    //     }
    // }

    const getTrace = async (suc) => {
        try {
            let url = `http://${window.location.hostname}:4000/api/action/attended-traces/${suc}`;
            if (query.get('area')) {
                url += `?area=${query.get('area')}`;
            }
            const res = await axios.get(url);
            const rows = [];
            let status = 'Libre';
            res.data.body.forEach(row => {
                if (row.state === 'espera toma') {
                    status = 'Libre';
                }
                else if (row.state === 'en toma' || row.state === 're-call') {
                    status = 'Activo';
                }

                rows.push({
                    id: row._id,
                    turn: row.turn,
                    startDate: moment(row.startDate).format("YYYY-MM-DD HH:mm:ss"),
                    ubication: row.ubication,
                    state: row.state,
                    sucursal: row.sucursal,
                    status: status, 
                    area: row.area,
                    username: row.username,
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
            const auxModule = await axios.get(`http://${window.location.hostname}:4000/api/modules/${mod}/${suc}`);
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
    //         const res = await axios.get(`http://${window.location.hostname}:4000/api/trace?ubication=${mod}|eq&sucursal=${suc}|eq|and&finalDate=null|eq|and`,{ 
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
            const res = await axios.get(`http://${window.location.hostname}:4000/api/users?username=${id.toUpperCase()}|eq`, {
                headers: {
                    'me': ''
                }
            });

            let exist = false;
            if (res.data.body.length) { 
                if (res.data.body[0].rol.toLowerCase() === 'recepcionista') {
                    if (isNew) {
                        const resTrace = await axios.get(`http://${window.location.hostname}:4000/api/trace?username=${id}|eq&finalDate=null|eq|and`, {
                            headers: {
                                'me': ''
                            }
                        });
                        if (resTrace.data.body.length === 0) {
                            exist = true;
                        }
                        else {
                            throw new Error('Aun tiene pacientes pendientes.');
                        }
                    }
                    else {
                        const resTrace = await axios.get(`http://${window.location.hostname}:4000/api/trace?username=${id}|eq&finalDate=null|eq|and&turn=${selectedTurn.turn.turn}|eq|and`, {
                            headers: {
                                'me': ''
                            }
                        });
                        if (resTrace.data.body.length > 0) {
                            if (resTrace.data.body[0].username.toUpperCase() === id.toUpperCase()) {
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
                    throw new Error('IdExakta no corresponde a un tomador o recepcionista de muestras.');
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
        setIdExakta({
            value: '',
            error: false
        });
    };

    const handleOpenDialog = (turn, action) => {
        setOpenDialog(true);
        setSelectedTurn({turn, action});
    };

    const selectTurn = (data) => {
        if (data.state === 'espera toma') {
            handleOpenDialog(data, 'atender');
        }
        else if (data.state === 'en toma' || data.state === 're-call') {
            handleOpenDialog(data, 'otra accion');
        }
    }

    const submit = async (action) => {
        if (!idExakta.error) {
            if (action === 'Atender') {
                const res = await validIdExakta(idExakta.value, true);
                if (res) {
                    handleCloseDialog();
                    handlerAttendTurn(idExakta.value);
                }
            }
            else if (action === 'Rellamar') {
                const res = await validIdExakta(idExakta.value);
                if (res) {
                    handleCloseDialog();
                    handlerReCallTurn(idExakta.value);
                }
            }
            else if (action === 'Cancelar') {
                const res = await validIdExakta(idExakta.value);
                if (res) {
                    handleCloseDialog();
                    handlerCancelationTurn(idExakta.value);
                }
            }
            else if (action === 'Terminar') {
                const res = await validIdExakta(idExakta.value);
                if (res) {
                    handleCloseDialog();
                    handlerAttendedTurn(idExakta.value);
                }
            }
            else if (action === 'Liberar') {
                const res = await validIdExakta(idExakta.value);
                if (res) {
                    handleCloseDialog();
                    handlerFreeTurn();
                }
            }
        }
    }

    const handlerChangeIdExakta = (e) => {
        if (e.target.value === '') {
            setIdExakta({
                value: '',
                error: true
            });
        }
        else {
            setIdExakta({
                value: e.target.value,
                error: false
            });
        }
    }


    const filterLab = async () => {
        try {
            const suc = window.atob(props.match.params.suc);
            let url = `http://${window.location.hostname}:4000/api/action/attended-traces/${suc}?area=Laboratorio`;
            if (filterLaboratorio !== '') {
                url += `&turn=${filterLaboratorio.toUpperCase()}`;
            }
            const res = await axios.get(url);

            const rows = [];
            let status = 'Libre';
            res.data.body.forEach(row => {
                if (row.state === 'espera toma') {
                    status = 'Libre';
                }
                else if (row.state === 'en toma' || row.state === 're-call') {
                    status = 'Activo';
                }

                rows.push({
                    id: row._id,
                    turn: row.turn,
                    startDate: moment(row.startDate).format("YYYY-MM-DD HH:mm:ss"),
                    ubication: row.ubication,
                    state: row.state,
                    sucursal: row.sucursal,
                    status: status, 
                    area: row.area,
                    username: row.username,
                });
            });

            const auxImageTraces = trace.filter(t => t.area === 'Imagen');
            auxImageTraces.forEach(element => {
                rows.push(element);
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

    const filterImg = async () => {
        try {
            const suc = window.atob(props.match.params.suc);
            let url = `http://${window.location.hostname}:4000/api/action/attended-traces/${suc}?area=Imagen&area=Citas`;
            if (filterImgen !== '') {
                url += `&turn=${filterImgen.toUpperCase()}`;
            }
            const res = await axios.get(url);

            const rows = [];
            let status = 'Libre';
            res.data.body.forEach(row => {
                if (row.state === 'espera toma') {
                    status = 'Libre';
                }
                else if (row.state === 'en toma' || row.state === 're-call') {
                    status = 'Activo';
                }

                rows.push({
                    id: row._id,
                    turn: row.turn,
                    startDate: moment(row.startDate).format("YYYY-MM-DD HH:mm:ss"),
                    ubication: row.ubication,
                    state: row.state,
                    sucursal: row.sucursal,
                    status: status, 
                    area: row.area,
                    username: row.username,
                });
            });

            const auxLabTraces = trace.filter(t => t.area === 'Laboratorio');
            auxLabTraces.forEach(element => {
                rows.push(element);
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

    const keyPress = (e, source) => {
        if(e.keyCode === 13){
            if (source === 'Imagen') {
                filterImg();   
            }
            else if (source === 'Laboratorio') {
                filterLab();
            }
         }
    }

    return (<>
        <div className="attendTest-container">
            {sucursalExist ?
                <><AttendMenu isModuleFree={true} sucursal={sucursal} module={modulo} configSuc={configSucursal}/>
                {module ? <div className="attendTest-content">
                    <div className="attendTest-body">
                        {(area === null || area === 'Laboratorio') &&
                            <div className="area-content">
                                <div className="title">
                                    Laboratorio
                                    <div className="text-search">
                                        <InputBase
                                            sx={{ ml: 1, flex: 1 }}
                                            placeholder="Búsqueda"
                                            value={filterLaboratorio}
                                            onKeyDown={(e) => keyPress(e, 'Laboratorio')}
                                            onChange={(e) => setFilterLab(e.target.value)}
                                        />
                                        <IconButton type="submit" sx={{ p: '10px' }} aria-label="search" onClick={filterLab}>
                                            <FiSearch />
                                        </IconButton>
                                    </div>
                                </div>
                                <div className="body">
                                    <div className="grid">
                                        {trace.filter(t => t.area === 'Laboratorio').map((element, index) => <TurnCard key={index} data={element} click={() => selectTurn(element)}/> )}
                                    </div>
                                </div>
                            </div>
                        }
                        {(area === null || area === 'Imagen') &&
                            <div className="area-content">
                                <div className="title">
                                    Imagen y Citas
                                    <div className="text-search">
                                        <InputBase
                                            sx={{ ml: 1, flex: 1 }}
                                            placeholder="Búsqueda"
                                            value={filterImgen}
                                            onKeyDown={(e) => keyPress(e, 'Imagen')}
                                            onChange={(e) => setFilterImg(e.target.value)}
                                        />
                                        <IconButton type="submit" sx={{ p: '10px' }} aria-label="search" onClick={filterImg}>
                                            <FiSearch />
                                        </IconButton>
                                    </div>
                                </div>
                                <div className="body">
                                    <div className="grid">
                                        {/*Agregar filtro para citas*/ }
                                        {trace.filter(t => t.area === 'Imagen' || t.area === 'Citas').map((element, index) => <TurnCard key={index} data={element} click={() => selectTurn(element)}/> )}
                                    </div>
                                </div>
                            </div>
                        }
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
            <DialogTitle>
                <div className="title-content">
                    <span>Turno seleccionado: {selectedTurn ? selectedTurn.turn ? selectedTurn.turn.turn : '' : ''}</span>
                    <AiOutlineClose className="button-close" onClick={handleCloseDialog}/>
                </div>
            </DialogTitle>
            <DialogContent>
                <TextField
                    error={idExakta.error}
                    helperText={idExakta.error ? 'Campo obligatorio.' : ''}                            
                    autoFocus
                    margin="dense"
                    label="IdExakta"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={idExakta.value}
                    onChange={handlerChangeIdExakta}
                />
            </DialogContent>
            <DialogActions>
                {selectedTurn && selectedTurn.action === 'otra accion' && <>
                    <ButtonBlue onClick={() => submit("Rellamar")}>Rellamar</ButtonBlue>
                    <ButtonGreen2 onClick={() => submit("Terminar")}>Terminar</ButtonGreen2>
                    <ButtonRed onClick={() => submit("Cancelar")}>Cancelar</ButtonRed>
                    <ButtonOrange onClick={() => submit("Liberar")}>Liberar</ButtonOrange>
                </>}
                {selectedTurn && selectedTurn.action === 'atender' && <>
                    <ButtonGreen onClick={() => submit("Atender")}>Atender</ButtonGreen>
                </>}
            </DialogActions>
        </Dialog>
    </>);
}

export default AttendTest;