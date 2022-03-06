import { useState, useEffect, useContext } from "react";
import { DataGrid, esES } from '@mui/x-data-grid';
import axios from "axios";
import moment from "moment";
import socketIOClient from "socket.io-client";
import AppContext from "../../context/app/app-context";
import AttendMenu from "../attendTurn/menu/menu";
import ModuleCard from "./modulesCards/moduleCard";
import RequireAuth from "../utils/auth/RequireAuth";
import './styles.css';

const columnsTurns = [
    { field: 'turn', headerName: 'Turno', flex: 1, mytype: 'string' },
    { field: 'area', headerName: 'Area', flex: 1, mytype: 'string' },
    { field: 'sucursal', headerName: 'Sucursal', flex: 1, mytype: 'string' },
    { field: 'state', headerName: 'Estado', flex: 1, mytype: 'string' },
    { field: 'creationDate', headerName: 'Fecha creación', flex: 1, mytype: 'date' }
];

const columnsTrace = [
    { field: 'turn', headerName: 'Turno', flex: 1, mytype: 'string' },
    { field: 'sucursal', headerName: 'Sucursal', flex: 1, mytype: 'string' },
    { field: 'state', headerName: 'Estado', flex: 1, mytype: 'string' },
    { field: 'username', headerName: 'Atendido por', flex: 1, mytype: 'string' },
    { field: 'startDate', headerName: 'Fecha inicio', flex: 1, mytype: 'date' },
    { field: 'finalDate', headerName: 'Fecha fin', flex: 1, mytype: 'date' },
];

function LookOut(props) {
    const ENDPOINT = `http://${window.location.hostname}:4000`;
    const urlModules = `http://${window.location.hostname}:4000/api/modules`;
    const { showAlert, module, user, setUser, setModule, getDataUser, setCurrentSucursal, currentSucursal } = useContext(AppContext);
    const [moduleSelect, setModuleSelect] = useState('');
    const [sucursalSelect, setSucursalSelect] = useState('');
    const [modules, setModules] = useState([]);
    const [sucursals, setSucursals] = useState([]);
    const [socket, setSocket] = useState(null);
    const [tab, setTab] = useState(0);
    const [turns, setTurns] = useState([]);
    const [trace, setTrace] = useState([]);
    const [dateState, setDateState] = useState(moment());
    const [timer, setTimer] = useState(null);
    const [configSucursal, setConfigSucursal] = useState({
        color: '#05805e'
    });

    const [stateModule, setStateModule] = useState({
        status: false,
        action: '',
        data: null
    });

    const [stateDataTurns, setStateDataTurns] = useState({
        status: false,
        action: '',
        data: null
    });

    const [slaveModules, setSlaveModules] = useState([]);

    const handlerChangeTab = (index) => {
        setTab(index);

        if (currentSucursal) {
            if (index === 0) {
                getTrace(currentSucursal);
            }
            else if (index === 1) {
                getTurns(currentSucursal);
            }
        }
    }

    useEffect(() => {
        async function init() {
            const auxSocket = socketIOClient(ENDPOINT);
            setSocket(auxSocket);
            getSucursals();
            const auxMyModule = await getMyModule();
            if (auxMyModule) {
                getSlaves(auxMyModule._id);
                getConfigSucursal(auxMyModule.sucursal);
                getTurns(auxMyModule.sucursal);
                getTrace(auxMyModule.sucursal);
            }
            
            const dataUser = getDataUser();
            if (dataUser) {
                setUser(dataUser);
                auxSocket.emit('join-sucursal', dataUser.sucursal);
            }
            
            auxSocket.on('newTurn', data => {
                if (data) {
                    setStateDataTurns({ status: true, action: 'addTurn', data: data });   
                }
            });

            auxSocket.on('moduleLess', resModule => {
                if (resModule) {
                    setStateModule({ status: true, action: 'greenLed', data: resModule });   
                }
            });

            auxSocket.on('addModule', resModule => {
                if (resModule) {
                    setStateModule({ status: true, action: 'grayLed', data: resModule });
                }
            });

            auxSocket.on('turnAttend', resTurn => {
                if (resTurn) {
                    setStateModule({ status: true, action: 'greenLed', data: resTurn });
                    setStateDataTurns({ status: true, action: 'updateTurn', data: resTurn });   
                }
            });

            auxSocket.on('turnFinish', resTurn => {
                if (resTurn) {
                    setStateModule({ status: true, action: 'redLed', data: resTurn });
                    setStateDataTurns({ status: true, action: 'updateTurn', data: resTurn });   
                }
            });

            auxSocket.on('turnReCall', resTurn => {
                showAlert("blue", `${resTurn.turn.ubication} ha re-llamado a: ${resTurn.turn.turn}`); 
                setStateDataTurns({ status: true, action: 'updateTurn', data: resTurn });   
            });

            setTimer(setInterval(() => setDateState(moment()), 1000));
        }
        
        init();
        
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (stateModule.status && stateModule.data !== null && stateModule.data.name) {
            setStateModule({ status: false, action: '', data: null });
            const auxSlaveModules = [...slaveModules];

            if (stateModule.action === 'greenLed') {
                //Actualizar listado de modulos a seleccionar
                const auxModules = modules.filter(m => m.name !== stateModule.data.name);
                if (auxModules.length) {
                    setModules(auxModules);
                    setModuleSelect(auxModules[0].name);
                }

                //Actualizar estado de las tarjetas de modulos
                for (let index = 0; index < auxSlaveModules.length; index++) {
                    const element = {...auxSlaveModules[index]};
                    if (element.name === stateModule.data.name) {
                        element.username = stateModule.data.username;
                        element.user = stateModule.data.user;
                        element.status = 'Inactivo';
                    }
                    auxSlaveModules[index] = element;
                }

                auxSlaveModules.sort(( a, b ) => {
                    if ( a.number < b.number ){
                    return -1;
                    }
                    if ( a.number > b.number ){
                    return 1;
                    }
                    return 0;
                });

                setSlaveModules(auxSlaveModules);
            }
            else if (stateModule.action === 'grayLed') {
                //Actualizar listado de modulos a seleccionar
                const auxModules = [...modules];
                const res = auxModules.find(m => m.name === stateModule.data.name);
                if (res === undefined && (stateModule.data !== undefined || stateModule.data !== null)) {
                    auxModules.push(stateModule.data);
                    auxModules.sort(( a, b ) => {
                        if ( a.name < b.name ){
                        return -1;
                        }
                        if ( a.name > b.name ){
                        return 1;
                        }
                        return 0;
                    });
                    setModules(auxModules);
                }

                //Actualizar estado de las tarjetas de modulos
                for (let index = 0; index < auxSlaveModules.length; index++) {
                    const element = {...auxSlaveModules[index]};
                    if (element.name === stateModule.data.name) {
                        element.username = '';
                        element.user = undefined;
                        element.status = 'Libre';
                    }
                    auxSlaveModules[index] = element;
                }

                auxSlaveModules.sort(( a, b ) => {
                    if ( a.number < b.number ){
                    return -1;
                    }
                    if ( a.number > b.number ){
                    return 1;
                    }
                    return 0;
                });

                setSlaveModules(auxSlaveModules);
            }
        }
        else if (stateModule.status && stateModule.data !== null && stateModule.data.turn) {
            setStateModule({ status: false, action: '', data: null });
            const auxSlaveModules = [...slaveModules];
            if (stateModule.action === 'greenLed') {
                //Actualizar estado de las tarjetas de modulos
                for (let index = 0; index < auxSlaveModules.length; index++) {
                    const element = {...auxSlaveModules[index]};
                    if (element.name === stateModule.data.ubication) {
                        element.status = 'Activo';
                    }
                    auxSlaveModules[index] = element;
                }

                auxSlaveModules.sort(( a, b ) => {
                    if ( a.number < b.number ){
                    return -1;
                    }
                    if ( a.number > b.number ){
                    return 1;
                    }
                    return 0;
                });

                setSlaveModules(auxSlaveModules);
            }
            else if (stateModule.action === 'redLed') {
                //Actualizar estado de las tarjetas de modulos
                for (let index = 0; index < auxSlaveModules.length; index++) {
                    const element = {...auxSlaveModules[index]};
                    if (element.name === stateModule.data.ubication) {
                        element.status = 'Inactivo';
                    }
                    auxSlaveModules[index] = element;
                }

                auxSlaveModules.sort(( a, b ) => {
                    if ( a.number < b.number ){
                    return -1;
                    }
                    if ( a.number > b.number ){
                    return 1;
                    }
                    return 0;
                });

                setSlaveModules(auxSlaveModules);
            }
        }
    }, [stateModule]);// eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (stateDataTurns.status && stateDataTurns.data !== null) {
            setStateDataTurns({ status: false, action: '', data: null });
            let auxTurns = [...turns];
            let auxTraces = [...trace];
            if (stateDataTurns.action === 'addTurn') {
                const row = {id: stateDataTurns.data.turn._id, ...stateDataTurns.data.turn};
                const rowTrace = {id: stateDataTurns.data.trace._id, ...stateDataTurns.data.trace};
                auxTurns.push(row);
                auxTraces.push(rowTrace);
                setTurns(auxTurns);
                setTrace(auxTraces);
            }
            else if (stateDataTurns.action === 'updateTurn') {
                const turn = stateDataTurns.data.turn.turn;
                const state = stateDataTurns.data.turn.state;

                if (state === 'terminado' || state === 'cancelado') {
                    auxTurns = auxTurns.filter(t => t.turn !== turn);
                    setTurns(auxTurns);

                    auxTraces = auxTraces.filter(t => t.turn !== turn);
                    setTrace(auxTraces);
                }
                else {
                    const turn = stateDataTurns.data.turn.turn;
                    for (let index = 0; index < auxTurns.length; index++) {
                        const element = {...auxTurns[index]};
                        if (element.turn === turn) {
                            element.state = stateDataTurns.data.turn.state;
                            auxTurns[index] = element;
                            setTurns(auxTurns);
                            break;
                        }
                    }

                    const auxTraces = [...trace];
                    const rowTrace = {id: stateDataTurns.data.trace._id, ...stateDataTurns.data.trace};

                    for (let index = 0; index < auxTraces.length; index++) {
                        let element = {...auxTraces[index]};
                        if (!element.finalDate) {
                            element.finalDate = moment().format("YYYY-MM-DD HH:mm:ss");
                            auxTraces[index] = element;
                            break;
                        }
                    }
                    auxTraces.push(rowTrace);
                    setTrace(auxTraces);
                }
            }
        }
    }, [stateDataTurns]);// eslint-disable-line react-hooks/exhaustive-deps

    const getSucursals = async () =>  {
        try {
            const urlApi = `http://${window.location.hostname}:5000/api/sucursal`;
            const res = await axios.get(urlApi);
        
            if (res.data.body.length) {
                setSucursals(res.data.body);
                setSucursalSelect(res.data.body[0].name);
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
    };

    useEffect(() => {
        if (configSucursal.timeLimit) {
            const result = trace.filter(r => r.finalDate === undefined && 
                (r.state === 'espera' || r.state === 'espera toma') && 
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
    
    const getModules = async (suc) => {
        try {
            const sucursal = suc ? suc : currentSucursal;
            const urlApi = `${urlModules}?sucursal=${sucursal}|eq`;
            const res = await axios.get(urlApi, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });
    
            const rows = [];
            res.data.body.forEach(async row => {
                let mode = undefined;
                let associate = undefined;
                if (row.type === 'modulo') {
                    mode = row.mode;
                    associate = row._id
                }

                rows.push({
                    id: row._id,
                    name: row.name,
                    type: row.type,
                    status: row.status,
                    sucursal: row.sucursal,
                    username: row.username,
                    // pattern: row.pattern,
                    mode: mode,
                    associate: associate
                });
            });
    
            rows.sort(( a, b ) => {
                if ( a.name < b.name ){
                  return -1;
                }
                if ( a.name > b.name ){
                  return 1;
                }
                return 0;
            });
            
            setModules(rows);
            if (rows.length) {
                setModuleSelect(rows[0].name);
            }            
    
            return rows;
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

    const getTurns = async (suc) => {
        try {
            const urlApi = `http://${window.location.hostname}:4000/api/action/lookout/shifts/${suc}`;
            const res = await axios.get(urlApi, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            const rows = [];
            res.data.body.forEach(row => {
                rows.push({
                    _id: row._id,
                    id: row._id,
                    turn: row.turn,
                    area: row.area,
                    creationDate: moment(row.creationDate).format("YYYY-MM-DD HH:mm:ss"),
                    state: row.state,
                    sucursal: row.sucursal
                });
            });

            setTurns(rows);
            return rows;
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

    const getTrace = async (suc) => {
        try {
            const urlApi = `http://${window.location.hostname}:4000/api/action/lookout/traces/${suc}`;
            const res = await axios.get(urlApi, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            const rows = [];
            res.data.body.forEach(row => {
                let finalDate = undefined;
                if (row.finalDate) {
                    finalDate = moment(row.finalDate).format("YYYY-MM-DD HH:mm:ss"); 
                }
                rows.push({
                    _id: row._id,
                    id: row._id,
                    turn: row.turn,
                    sucursal: row.sucursal,
                    state: row.state,
                    username: row.username,
                    startDate: moment(row.startDate).format("YYYY-MM-DD HH:mm:ss"),
                    finalDate: finalDate
                });
            });

            setTrace(rows);
            return rows;
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

    const getMyModule = async () => {
        try {
            const dataUser = getDataUser();
            if (dataUser) {
                if (module === undefined || module === null) {
                    const urlApi = `http://${window.location.hostname}:4000/api/modules?username=${dataUser.username}|eq`;
                    const res = await axios.get(urlApi, { 
                        headers: {
                            'auth': localStorage.getItem('token')
                        }
                    });
    
                    if (res.data.body.length) {
                        const auxModule = res.data.body[0];
                        setModule(auxModule);
                        setCurrentSucursal(auxModule.sucursal);
                        return auxModule;
                    } 
                }
                else {
                    return module;
                }
            }  
            
            return null;
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

    const getSlaves = async (idVigia) => {
        try {
            const urlApi = `http://${window.location.hostname}:4000/api/slaves/${idVigia}`;
            const res = await axios.get(urlApi, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            const auxData = [];

            for (let index = 0; index < res.data.body.length; index++) {
                const element = res.data.body[index];
                
                let pos = 0;
                for(let i = 0; i < element.modulo.name.length; i++) {
                    if(!isNaN(element.modulo.name[i])) {
                        pos = i;
                        break;
                    }
                }

                let user = {};
                if (element.modulo.username && element.modulo.username !== '') {
                    const resUser = await axios.get(`http://${window.location.hostname}:4000/api/users?username=${element.modulo.username}|eq`, { 
                        headers: {
                            'auth': localStorage.getItem('token')
                        }
                    });

                    if (resUser.data.body.length) {
                        user = resUser.data.body[0];
                    }
                }

                let privileges = [];
                const resPrivilage = await axios.get(`http://${window.location.hostname}:4000/api/privilege/${element.modulo._id}`, { 
                    headers: {
                        'auth': localStorage.getItem('token')
                    }
                });

                if (resPrivilage.data.body.length) {
                    privileges = resPrivilage.data.body;
                }

                const number = element.modulo.name.substr(pos, element.modulo.name.length - pos);
                let status = element.modulo.status ? 'Activo' : 'Inactivo';
                status = element.modulo.username !== undefined && element.modulo.username !== '' ? status : 'Libre';
                auxData.push({
                    number: number,
                    username: element.modulo.username,
                    status: status,
                    mode: element.modulo.mode,
                    id: element.modulo._id,
                    name: element.modulo.name,
                    user: user,
                    privilages: privileges,
                    isPrivilegeByArrivalTime: element.modulo.isPrivilegeByArrivalTime
                });

                auxData.sort(( a, b ) => {
                    if ( a.number < b.number ){
                    return -1;
                    }
                    if ( a.number > b.number ){
                    return 1;
                    }
                    return 0;
                });
            }

            setSlaveModules(auxData);
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

    const getConfigSucursal = async (suc) => {
        try {
            const urlApi = `http://${window.location.hostname}:4000/api/sucursal`;
            const res = await axios.get(urlApi, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            const dataConfig = res.data.body.find(s => s.name === suc);
            setConfigSucursal(dataConfig);
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
    
    //------------------------------------------------------------------------
    const updateStateModule = async (username, isLogout = false) => {
        try {
            const auxModule = module ? module.name : moduleSelect;
            const urlApi = urlModules + `/${auxModule}/${currentSucursal}`;
            const res = await axios.put(urlApi, {username: username}, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });
    
            if (username === '') {
                if (module) {
                  socket.emit('addModule', {sucursal:currentSucursal, data: module});
                }
                setModule(null);
                if (isLogout) {
                  socket.disconnect();   
                  clearInterval(timer);
                  setTimer(null);
                }
                else {
                    getModules();
                }

                return null;
            }
            else {
                const data = {...res.data.body};
                setModule(data);
                // setAnchorElMenu(null);
    
                if (socket) {
                    socket.emit('join-type', {
                        sucursal:currentSucursal, 
                        type:data.type, 
                        name:data.name, 
                        username: username
                    });
                }

                return data;
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

    const handlerChangeModule = () => {
        if (socket) {
            socket.emit('leave-type', { sucursal: currentSucursal, type: module.type });
        }
        updateStateModule('');
    }

    const handlerChangeModuleSelect = (event) => {
        setModuleSelect(event.target.value);
    }

    const handlerOkModuleSelect = async () => {
        const res = await updateStateModule(user.username);
        if (res) {
            getSlaves(res._id);
            getTurns(currentSucursal);
            getTrace(currentSucursal);
        }
    }

    const handlerChangeSucursal = () => {
        if (socket) {
            setConfigSucursal({...configSucursal, color: '#05805e' });
            setCurrentSucursal(null);
            setModules([]);
            setModuleSelect('');
            socket.emit('leave-sucursal', currentSucursal);
            if (module) {
                socket.emit('leave-type', { sucursal: currentSucursal, type: module.type }); 
                updateStateModule('');
            }
        }
    }
    
    const handlerChangeSucursalSelect = (event) => {
        setSucursalSelect(event.target.value);
    }

    const handlerOkSucursalSelect = () => {
        setCurrentSucursal(sucursalSelect);
        socket.emit('join-sucursal', sucursalSelect);
        getModules(sucursalSelect);
        getConfigSucursal(sucursalSelect);
    }

    return (<>
        <RequireAuth>
            <div className="lookout-container">
                <AttendMenu moduleSelect={moduleSelect} modules={modules} 
                            sucursalSelect={sucursalSelect} sucursals={sucursals} configSuc={configSucursal}
                            setConfigSucursal={setConfigSucursal}
                            updateStateModule={updateStateModule}
                            handlerChangeModule={handlerChangeModule}
                            handlerChangeModuleSelect={handlerChangeModuleSelect}
                            handlerOkModuleSelect={handlerOkModuleSelect}
                            handlerChangeSucursal={handlerChangeSucursal}
                            handlerChangeSucursalSelect={handlerChangeSucursalSelect}
                            handlerOkSucursalSelect={handlerOkSucursalSelect}/>
                <div className="lookout-content">
                    {module && <>
                    <div className="up">
                        <span className="title">Modulos</span>
                        <div className="list">
                            {slaveModules.map((element, index) => <ModuleCard key={index} data={element}/>)}
                        </div>
                    </div>
                    <div className="down">
                        <span className="title">Turnos</span>
                        <div className="tab-container">
                            <div className="tab-buttons">
                                <div className={tab === 0 ? 'tab select' : 'tab'} onClick={()=>handlerChangeTab(0)}>En proceso</div>
                                <div className={tab === 1 ? 'tab select' : 'tab'} onClick={()=>handlerChangeTab(1)}>Trazas</div>
                            </div>
                            <div className="tab-body">
                                {tab === 0 ? <div className="page">
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
                                            return params.row.limit && (params.row.state === 'espera' || params.row.state === 'espera toma') ? `super-app-theme ` : '';
                                        }}
                                    />
                                </div> :
                                <div className="page">
                                <DataGrid
                                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                                    rows={trace}
                                    columns={columnsTrace}
                                    pageSize={10}
                                    rowsPerPageOptions={[10]}
                                    disableSelectionOnClick
                                    onSelectionModelChange={(ids) => {
                                        console.log(ids[0]);
                                    }}
                                />
                            </div>}
                            </div>
                        </div>
                    </div>
                    </>}
                    {!module && user &&
                    <div className="greeting">
                        <span className="title">Hola {user.name}!</span>
                    </div>
                    }
                </div>
            </div>
        </RequireAuth>
    </>);
}

export default LookOut;