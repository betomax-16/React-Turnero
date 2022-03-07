import { useState, useEffect, useContext, useMemo } from "react";
import socketIOClient from "socket.io-client";
import axios from "axios";
import moment from "moment";
import AppContext from "../../context/app/app-context";
import CurrentTurn from "../screen/currentTurn/currentTurn";
import TurnList from "../screen/turnList/turnList";
import { useLocation } from "react-router-dom";
import logo from '../../public/img/logo.png';
import './styles.css';

function Screen(props) {
    const ENDPOINT = `http://${window.location.hostname}:4000`;
    const { showAlert } = useContext(AppContext);
    const { search } = useLocation();
    const query = useMemo(() => new URLSearchParams(search), [search]);
    const [showTV, setShowTV] = useState(false);
    const [sucursalExist, setSucursalExist] = useState(false);
    const [dateState, setDateState] = useState(moment());
    const [shifts, setShifts] = useState([]);
    const [timer, setTimer] = useState(5000);
    const [lastTurns, setLastTurns] = useState([]);
    const [recall, setRecall] = useState({state: false, data: {
        turn: '',
        ubication: ''
    }});
    const [currentTurn, setCurrentTurn] = useState({
        turn:'', ubication: ''
    });
    const [stateDataTurns, setStateDataTurns] = useState({
        status: false,
        action: '',
        data: null
    });

    useEffect(() => {
        async function init() {
            try {
                setRecall({state: false, data: {
                    turn: '',
                    ubication: ''
                }});
                const sucursal = window.atob(props.match.params.suc);
                if (await callGetSucursal(sucursal)) {
                    const auxSocket = socketIOClient(ENDPOINT);
                    auxSocket.emit('join-sucursal', sucursal);
                    auxSocket.emit('join-module', {sucursal:sucursal, module:'screen'});
                    getDataConfig();
                    getLastTurns();
                    setInterval(() => {
                        if (moment().hour() === 22 && moment().minute() === 0 && moment().second() === 1) {
                            window.location.reload();
                        }
                        setDateState(moment())
                    }, 1000);
    
                    auxSocket.on('turnAttend', resTurn => {
                        console.log(resTurn);
                        setStateDataTurns({ status: true, action: 'addTurn', data: resTurn });  
                    });
    
                    auxSocket.on('turnFinish', resTurn => {
                        setStateDataTurns({ status: true, action: 'finishTurn', data: resTurn });   
                    });
    
                    auxSocket.on('turnReCall', resTurn => {
                        emphasis(resTurn);
                    });
    
                    auxSocket.on('refresh', () => {
                        window.location.reload();
                    });

                    if (query.get('tv') && query.get('tv').toLowerCase() === 'si') {
                        setShowTV(true);
                    }
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
        
        init();
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (stateDataTurns.status && stateDataTurns.data !== null) {
            setStateDataTurns({ status: false, action: '', data: null });
            if (stateDataTurns.action === 'addTurn') {
                const auxTurn = lastTurns.find(t => t.turn === stateDataTurns.data.turn.turn);
                if (!auxTurn) {
                    const auxShifts = [...shifts];
                    auxShifts.push(stateDataTurns.data.turn);
                    setShifts(auxShifts);

                    let data = {};
                    if (typeof stateDataTurns.data.turn === 'object') {
                        data = {...stateDataTurns.data};
                    }
                    else {
                        data = {
                            turn: {...stateDataTurns.data},
                            ubication: stateDataTurns.data.ubication
                        }
                    }


                    if (recall.state) {
                        setTimeout(() => { 
                            emphasis(data);
                        }, timer*(auxShifts.length - 1));
                    }
                    else {
                        emphasis(data);
                    }

                    const auxLastTurns = [...lastTurns];

                    if (!auxLastTurns.find(t => t.turn === data.turn.turn)) {
                        auxLastTurns.push({...data.turn});

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

                        setCurrentTurn(data.turn);

                        setLastTurns(auxLastTurns);
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

                if (auxTurns.length) {
                    // if (auxTurns[0].turn === stateDataTurns.data.turn.turn) {
                    //     setCurrentTurn({turn: '', ubication: ''});    
                    // }
                    setCurrentTurn({turn: auxTurns[0].turn, ubication: auxTurns[0].ubication});    
                }
                else {
                    setCurrentTurn({turn: '', ubication: ''});    
                }
                
                setLastTurns(auxTurns);
            }
        }
    }, [stateDataTurns]);// eslint-disable-line react-hooks/exhaustive-deps


    const callGetSucursal = async (sucursal) => {
        try {
          const res = await axios.get(`http://${window.location.hostname}:5000/api/sucursal/${sucursal}`);
          const exist = res.data.statusCode === 200;
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

    const getDataConfig = async () => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:4000/api/config`, { 
                headers: {
                    'me': ''
                }
            });
            
            if (res.data.body.length) {
                setTimer(res.data.body[0].timer);
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

    const emphasis =  (resTurn) => {
        return new Promise((resolve, reject) => {

            setRecall({
                state: true,
                data: {
                    turn: resTurn.turn.turn,
                    ubication: resTurn.ubication
                }
            });
    
            setTimeout(() => { 
                setRecall({
                    state: false, 
                    data: {
                        turn: '',
                        ubication: ''
                    }
                });

                const auxShifts = [...shifts];
                auxShifts.shift();
                setShifts(auxShifts);

                resolve(true);
            }, timer);
        });
    }

    const getLastTurns = async () => {
        try {
            const sucursal = window.atob(props.match.params.suc);
            const res = await axios.get(`http://${window.location.hostname}:4000/api/action/pendding/${sucursal}`);
            const auxTurns = [...res.data.body];
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
            if (auxTurns.length) {
                setCurrentTurn({turn: auxTurns[0].turn, ubication: auxTurns[0].ubication});
            }
            return res.data.body;
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

    return <div className="screen-content">
        {sucursalExist ? showTV ? <>
            <iframe className="tv" style={{display: !recall.state ? 'inherit' : 'none'}} title="tele" src="https://pluto.tv/es/live-tv/pluto-tv-cine-estelar-1"></iframe>
            {recall.state && <CurrentTurn currentTurn={recall.data} wave="wave-down" playSound={true}/>}
        </> :
        !recall.state ? 
            <TurnList date={dateState} currentTurn={currentTurn} lastTurns={lastTurns} showAdds={props.showAdds}/> :
            <CurrentTurn currentTurn={recall.data} wave="wave-down" playSound={true}/>
        : <>
            <div className="takeTurn-empty-header">
                <h1>Sucursal inexistente.</h1>
            </div>
            <div className="takeTurn-empty-body">
                <img className="takeTurn-logo" src={logo} alt="logo"></img>
            </div>
       </>}
    </div>
}

export default Screen;