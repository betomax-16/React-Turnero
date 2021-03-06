import { useState, useEffect, useContext } from "react";
import axios from "axios";
import moment from "moment";
import socketIOClient from "socket.io-client";
import AppContext from "../../context/app/app-context";
import AttendMenu from "./menu/menu";
import Attend from "./attend/attend";
import TurnList from "../screen/turnList/turnList";
import RequireAuth from "../utils/auth/RequireAuth";
import './styles.css';

moment.locale('es', {
  months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
  monthsShort: 'Enero._Feb._Mar_Abr._May_Jun_Jul._Ago_Sept._Oct._Nov._Dec.'.split('_'),
  weekdays: 'Domingo_Lunes_Martes_Miercoles_Jueves_Viernes_Sabado'.split('_'),
  weekdaysShort: 'Dom._Lun._Mar._Mier._Jue._Vier._Sab.'.split('_'),
  weekdaysMin: 'Do_Lu_Ma_Mi_Ju_Vi_Sa'.split('_')
});

function AttendTurn(props) {
  const ENDPOINT = `http://localhost:4000`;
  const urlModules = `http://localhost:4000/api/modules`;
  const { showAlert, module, user, getDataUser, setModule, setUser, setCurrentSucursal, currentSucursal } = useContext(AppContext);
  const [areas, setAreas] = useState([]);
  const [dateState, setDateState] = useState(moment());
  const [lastTurns, setLastTurns] = useState([]);
  const [socket, setSocket] = useState(null);
  const [modules, setModules] = useState([]);
  const [sucursals, setSucursals] = useState([]);
  const [moduleSelect, setModuleSelect] = useState('');
  const [sucursalSelect, setSucursalSelect] = useState('');
  const [timer, setTimer] = useState(null);
  
  const [currentTurn, setCurrentTurn] = useState({
    turn:''
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

  useEffect(() => {
    async function init() {
      const auxSocket = socketIOClient(ENDPOINT);
      setSocket(auxSocket);
  
      const dataUser = getDataUser();
      if (dataUser) {
        setUser(dataUser);
        const res = await getMyModule(dataUser, auxSocket);
        if (!res) {
          getSucursals();
        }
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
        }
      });
  
      auxSocket.on('turnFinish', resTurn => {
        if (resTurn) {
          setStateDataTurns({ status: true, action: 'finishTurn', data: resTurn });   
        }
      });

      setTimer(setInterval(() => setDateState(moment()), 1000));
    };

    init();
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (stateModule.status && stateModule.data !== null && stateModule.data.name) {
      setStateModule({ status: false, action: '', data: null });
      if (stateModule.action === 'greenLed') {
        //Actualizar listado de modulos a seleccionar
        const auxModules = modules.filter(m => m.name !== stateModule.data.name);
        if (auxModules.length) {
            setModules(auxModules);
            setModuleSelect(auxModules[0].name);
        }
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
      }
    }
    else if (stateModule.status && stateModule.data !== null && stateModule.data.turn) {
      setStateModule({ status: false, action: '', data: null });
      if (stateModule.action === 'greenLed') {
        const auxAreas = [...areas];
        for (let index = 0; index < auxAreas.length; index++) {
          const element = {...auxAreas[index]};
          if (element.name === stateModule.data.turn.area && element.number > 0) {
            element.number--;
            auxAreas[index] = element;
            setAreas(auxAreas);
            break;
          }
        }

        const auxTurn = lastTurns.find(t => t.turn === stateModule.data.turn.turn);
        if (!auxTurn) {
            const auxLastTurns = [...lastTurns];
            auxLastTurns.push(stateModule.data.turn);

            //Mayor a menor
            auxLastTurns.sort(( a, b ) => {
              if ( moment(a.creationDate) > moment(b.creationDate) ){
                return -1;
              }
              if ( moment(a.creationDate) < moment(b.creationDate) ){
                return 1;
              }
              return 0;
            });

            if (auxLastTurns.length > 3) {
              auxLastTurns.pop();
            }

            setLastTurns(auxLastTurns);
        }
      }
    }

    // console.log('stateModule');
  }, [stateModule]);// eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (stateDataTurns.status && stateDataTurns.data !== null) {
      setStateDataTurns({ status: false, action: '', data: null });
      if (stateDataTurns.action === 'addTurn') {
        if (areas.length) {
          const auxAreas = [...areas];
          for (let index = 0; index < auxAreas.length; index++) {
            const element = {...auxAreas[index]};
            if (element.name === stateDataTurns.data.turn.area) {
              element.number++;
              auxAreas[index] = element;
              setAreas(auxAreas);
              break;
            }
          }
        }
      }
      else if (stateDataTurns.action === 'finishTurn') {
        const auxTurns = lastTurns.filter(t => t.turn !== stateDataTurns.data.turn.turn);
        auxTurns.sort(( a, b ) => {
          if ( moment(a.creationDate) > moment(b.creationDate) ){
            return -1;
          }
          if ( moment(a.creationDate) < moment(b.creationDate) ){
            return 1;
          }
          return 0;
        });

        setLastTurns(auxTurns);
      }
    }
    
    // console.log('stateDataTurns');
  }, [stateDataTurns]);// eslint-disable-line react-hooks/exhaustive-deps

  const getSucursals = async () =>  {
    try {
      const urlApi = `http://localhost:5000/api/sucursal`;
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
        res.data.body.forEach(row => {
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
                pattern: row.pattern,
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

  const updateStateModule = async (username, isLogout = false) => {
    try {
        const auxModule = module ? module.name : moduleSelect;
        if (auxModule !== '' || auxModule !== undefined) {
          const urlApi = urlModules + `/${auxModule}/${currentSucursal}`;
          const res = await axios.put(urlApi, {username: username}, { 
              headers: {
                  'auth': localStorage.getItem('token')
              }
          });

          if (username === '') {
              console.log(module);
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
          }
          else {
              const data = {...res.data.body};
              setModule(data);

              getPendingTurn(data);

              // setAnchorEl(null);

              if (socket) {
                console.log(data);
                socket.emit('join-type', {sucursal:currentSucursal, type:data.type, name:data.name, username: user.username});
              }
          }  
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
        socket.emit('leave-type', { sucursal: user.sucursal, type: module.type });
    }
    updateStateModule('');
  }

  const handlerChangeModuleSelect = (event) => {
    setModuleSelect(event.target.value);
  }

  const handlerOkModuleSelect = () => {
    updateStateModule(user.username);
    getAreas();
    getLastTurns();
  }

  const handlerChangeSucursal = () => {
    if (socket) {
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
  }
//-----------------------------------------------------------------------------
  const getMyModule = async (dataUser, auxSocket) => {
    try {
      if (dataUser) {
        const urlApi = `http://localhost:4000/api/modules?username=${dataUser.username}|eq`;
        const res = await axios.get(urlApi, { 
            headers: {
                'auth': localStorage.getItem('token')
            }
        });

        let auxModule = null;
        if (res.data.body.length) {
            auxModule = res.data.body[0];
            getAreas(auxModule.sucursal);
            getLastTurns(auxModule.sucursal);
            const resPending = await getPendingTurn(auxModule);
            if (auxSocket) {
              auxSocket.emit('join-sucursal', auxModule.sucursal);
              auxSocket.emit('join-type', {sucursal:auxModule.sucursal, type:auxModule.type, name:auxModule.name, username: dataUser.username});

              if (resPending) {
                auxSocket.emit('turnAttend', { sucursal: auxModule.sucursal, data: resPending });
              }
            }
        }
        else {
          return false;
        }

        setModule(auxModule);
        setCurrentSucursal(auxModule.sucursal);
        return true;
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

  const getAreas = async (suc) => {
    try {
      const dataUser = getDataUser();
      if (dataUser) {
        const sucursal = suc ? suc : currentSucursal;
        const resAreas = await axios.get(`http://localhost:4000/api/area-sucursal/${sucursal}`, { 
          headers: {
              'auth': localStorage.getItem('token')
          }
        });

        const rows = [];

        for (let index = 0; index < resAreas.data.body.length; index++) {
          const row = resAreas.data.body[index];
          const resNums = await axios.get(`http://localhost:4000/api/shifts?area=${row.area}|eq&sucursal=${sucursal}|eq|and&state=espera|eq|and`, { 
              headers: {
                  'auth': localStorage.getItem('token')
              }
          });

          const num = resNums.data.body ? resNums.data.body.length : 0;
          rows.push({
            name: row.area,
            number: num
          });
        }

        setAreas(rows);
        return rows;
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

  const getPendingTurn = async (dataModule) => {
    try {
      const res = await axios.get(`http://localhost:4000/api/trace?ubication=${dataModule.name}|eq&finalDate=null|eq|and`, { 
        headers: {
          'auth': localStorage.getItem('token')
        }
      });

      let turn = null;
      if (res.data.body.length) {
        turn = res.data.body[0];
        setCurrentTurn(turn);
      }
      else {
        setCurrentTurn({turn: ''});
      }

      return turn;
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

  const getLastTurns = async (suc) => {
    try {
      const AuxUser = getDataUser();
      if (AuxUser) {
        const sucursal = suc ? suc : currentSucursal;
        const res = await axios.get(`http://localhost:4000/api/action/pendding/${sucursal}`, { 
          headers: {
              'auth': localStorage.getItem('token')
          }
        });
  
        setLastTurns(res.data.body);
        console.log(res);
        return res.data.body;
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

  const handlerAttendTurn = async (area) => {
    if (module && !module.status) {
      const findArea = areas.find(a => a.name === area);
      if ((findArea && findArea.number > 0) || area === '') {
        try {
          const data = {
            area: area,
            sucursal: currentSucursal
          };
    
          const res = await axios.post(`http://localhost:4000/api/action/next`, data, { 
            headers: {
                'auth': localStorage.getItem('token')
            }
          });
    
          if (area !== '') {
            const auxAreas = [...areas];
            const auxArea = auxAreas.find(a => a.name === area);
            if (auxArea) {
              auxArea.number--;
            }
            setAreas(auxAreas);
          }

          const turn = {...res.data.body, ubication: module.name};
          const auxLastTurns = [...lastTurns];
          auxLastTurns.push(turn);
          auxLastTurns.sort(( a, b ) => {
            if ( moment(a.creationDate) > moment(b.creationDate) ){
              return -1;
            }
            if ( moment(a.creationDate) < moment(b.creationDate) ){
              return 1;
            }
            return 0;
          });

          setCurrentTurn(turn);
          setLastTurns(auxLastTurns);

          if (socket) {
            socket.emit('turnAttend', { sucursal: currentSucursal, data: turn });
          }
  
          const auxModule = {...module};
          auxModule.status = true;
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
        showAlert("yellow", 'No hay turnos a atender.');
      }
    }
    else {
      showAlert("yellow", 'No puede solicitar otro turno hasta terminar de atender al actual.');
    }
  }

  const handlerReCallTurn = async (area) => {
    if (module && module.status) {
      try {
        const data = {
          turn: currentTurn.turn,
          sucursal: currentSucursal
        };
  
        const res = await axios.post(`http://localhost:4000/api/action/recall`, data, { 
          headers: {
              'auth': localStorage.getItem('token')
          }
        });
        
        showAlert("blue", `Ha re-llamado a: ${currentTurn.turn}`); 

        if (socket) {
          const turn = {...res.data.body, ubication: module.name};
          socket.emit('turnReCall', { sucursal: currentSucursal, data: turn });
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

  const handlerCancelationTurn = async (area) => {
    if (module && module.status) {
      try {
        const data = {
          turn: currentTurn.turn,
          sucursal: currentSucursal,
          ubication: module.name
        };
  
        const res = await axios.post(`http://localhost:4000/api/action/cancelation`, data, { 
          headers: {
              'auth': localStorage.getItem('token')
          }
        });
  
        const auxLastTurns = lastTurns.filter(t => t.turn !== currentTurn.turn);
        auxLastTurns.sort(( a, b ) => {
          if ( moment(a.creationDate) > moment(b.creationDate) ){
            return -1;
          }
          if ( moment(a.creationDate) < moment(b.creationDate) ){
            return 1;
          }
          return 0;
        });

        setCurrentTurn({turn: ''});
        setLastTurns(auxLastTurns);
        
        if (socket) {
          const turn = {...res.data.body, ubication: module.name};
          socket.emit('turnFinish', { sucursal: currentSucursal, data: turn });
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

  const handlerAttendedTurn = async (area) => {
    if (module && module.status) {
      try {
        const data = {
          turn: currentTurn.turn,
          sucursal: currentSucursal,
          module: module.name
        };
  
        const res = await axios.post(`http://localhost:4000/api/action/attended`, data, { 
          headers: {
              'auth': localStorage.getItem('token')
          }
        });
  
        const auxLastTurns = lastTurns.filter(t => t.turn !== currentTurn.turn);
        auxLastTurns.sort(( a, b ) => {
          if ( moment(a.creationDate) > moment(b.creationDate) ){
            return -1;
          }
          if ( moment(a.creationDate) < moment(b.creationDate) ){
            return 1;
          }
          return 0;
        });

        setCurrentTurn({turn: ''});
        setLastTurns(auxLastTurns);

        if (socket) {
          const turn = {...res.data.body, ubication: module.name};
          socket.emit('turnFinish', { sucursal: currentSucursal, data: turn });
          if (currentTurn.area !== 'Resultados') {
            socket.emit('newTurnTest', { sucursal: currentSucursal, type: 'toma', data: turn }); 
          }
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

  return (
    <RequireAuth>
      <div className="attendTurn-container">
        <AttendMenu moduleSelect={moduleSelect} modules={modules} 
                    sucursalSelect={sucursalSelect} sucursals={sucursals}
                    updateStateModule={updateStateModule}
                    handlerChangeModule={handlerChangeModule}
                    handlerChangeModuleSelect={handlerChangeModuleSelect}
                    handlerOkModuleSelect={handlerOkModuleSelect}
                    handlerChangeSucursal={handlerChangeSucursal}
                    handlerChangeSucursalSelect={handlerChangeSucursalSelect}
                    handlerOkSucursalSelect={handlerOkSucursalSelect}/>
        {module && <>
          <div className="attendTurn-content">
            <Attend areas={areas} currentTurn={currentTurn} socket={socket}
                    setAreas={setAreas}
                    handlerAttendTurn={handlerAttendTurn}
                    handlerAttendedTurn={handlerAttendedTurn}
                    handlerCancelationTurn={handlerCancelationTurn}
                    handlerReCallTurn={handlerReCallTurn}/>
            <div className="attendTurn-body">
                <TurnList date={dateState} currentTurn={currentTurn} lastTurns={lastTurns}/>
            </div>
          </div>
        </>}
        {!module && user &&
          <div className="greeting">
              <span className="title">Hola {user.name}!</span>
          </div>
        }
      </div>
    </RequireAuth>
  );
}

export default AttendTurn;