import { useContext, useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import AppContext from "../../../context/app/app-context";
import Confirm from "../../utils/confirm/confirm";
import './styles.css';
import { FaUsers } from "react-icons/fa";
import { IoTicket, IoStorefront } from "react-icons/io5";
import { BiLogOut, BiCurrentLocation, BiReset } from "react-icons/bi";
import { BsClockHistory } from "react-icons/bs";
import { MdSchema, MdLocalConvenienceStore } from "react-icons/md";
import { HiDocumentReport } from "react-icons/hi";
import { GiGears } from "react-icons/gi";
import { RiBuilding2Fill } from "react-icons/ri";
import { FaBuysellads } from "react-icons/fa";
import Tooltip from '@mui/material/Tooltip';
import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import logo from "../../../public/img/logo.png";
import Log from "../../utils/logError/log";


function Menu(props) {
    const { userLogout, showAlert, setReset, reset, getDataUser, setUser, user } = useContext(AppContext);
    const [toggleTurn, setToggleTurn] = useState(false);

    const [openConfirm, setOpenConfirm] = useState(false);
    const [openModalSuc, setOpenModalSuc] = useState(false);
    const [sucursals, setSucursals] = useState([]);
    const [selectSucursal, setSelectSucursal] = useState('');
    const handleAcceptConfirm = async () => {
        let url = '';
        const me = getDataUser();
        try {
            const query = selectSucursal !== '' ? `?suc=${selectSucursal}` : '';
            url = `http://${window.location.hostname}:4000/api/action/reset${query}`;
            const res = await axios.delete(url, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            const dataSave = {
                username: me ? me.username : null,
                source: 'admin',
                action: 'menu.js (handleAcceptConfirm {delete})',
                apiUrl: url,
                bodyBeforeRequest: {},
                bodyRequest: {},
                bodyResponse: res.data
            };
            Log.SendLogAction(dataSave);

            setReset(reset+1);
            showAlert("green", 'Re-inicio exitoso.');
        } catch (error) {
            console.log(error);
            if (error.response && error.response.data) {
                showAlert("red", error.response.data.body.message);
                const dataSave = {
                    username: me ? me.username : null,
                    source: 'admin',
                    action: 'menu.js (handleAcceptConfirm)',
                    apiUrl: url,
                    bodyRequest: {},
                    bodyResponse: error.response.data
                };
                Log.SendLogError(dataSave);
            }
            else {
                showAlert("red", 'Ocurrió algún error interno.');
            }
        }
        setOpenConfirm(false);
        setOpenModalSuc(false);
    };

    const handleCloseConfirm = () => {
        setOpenConfirm(false);
    };

    const onChangeSucursal = (suc) => {
        setSelectSucursal(suc);
    }

    const handlerCloseModalSucursal = () => {
        setOpenModalSuc(false);
    }

    const handlerOpenModalSucursal = async () => {
        try {
            setOpenModalSuc(true);
            const urlApi = `http://${window.location.hostname}:4000/api/sucursal`;
            const res = await axios.get(urlApi, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            if (res.data.body.length) {
                const auxSucursals = res.data.body.sort(( a, b ) => {
                    if ( a.name < b.name ){
                      return -1;
                    }
                    if ( a.name > b.name ){
                      return 1;
                    }
                    return 0;
                });

                setSucursals(auxSucursals);
                setSelectSucursal(auxSucursals[0].name);
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
    }

    useEffect(() => {
        const aux_user = getDataUser();
        setUser(aux_user);
        console.log(aux_user);
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    return (<>
        <nav className="menu-container">
            <div className="logo">
                <img src={logo} alt="logo"></img>
                {/* <span className="capital">E</span> */}
            </div>
            <div className="options">
                {user && user.rol === 'Super-Admin' && <Link to="/admin/marcas">
                    <div className="option">
                        <Tooltip title="Marcas">
                            <div className="icon">
                                <RiBuilding2Fill size={30}/>
                            </div>    
                        </Tooltip>
                        <span className="title">Marcas</span>
                    </div>
                </Link>}
                {user && (user.rol === 'Admin' || user.rol === 'Super-Admin') && <Link to="/admin/sucursales">
                    <div className="option">
                        <Tooltip title="Sucursales">
                            <div className="icon">
                                <IoStorefront size={30}/>
                            </div>    
                        </Tooltip>
                        <span className="title">Sucursales</span>
                    </div>
                </Link>}
                <Link to="/admin/usuarios">
                    <div className="option">
                        <Tooltip title="Usuarios">
                            <div className="icon">
                                <FaUsers size={30}/>
                            </div>    
                        </Tooltip>
                        <span className="title">Usuarios</span>
                    </div>
                </Link>
                <Link to="/admin/modulos">
                    <div className="option">
                        <Tooltip title="Modulos">
                            <div className="icon">
                                <MdLocalConvenienceStore size={30}/>
                            </div> 
                        </Tooltip>
                        <span  className="title">Modulos</span>
                    </div>
                </Link>
                {user && (user.rol === 'Admin' || user.rol === 'Super-Admin') && <Link to="/admin/areas">
                    <div className="option">
                        <Tooltip title="Areas">
                            <div className="icon">
                                <MdSchema size={30}/>
                            </div> 
                        </Tooltip>
                        <span  className="title">Areas</span>
                    </div>
                </Link>}
                <div>
                    <div className="option" onClick={() => {setToggleTurn(!toggleTurn)}}>
                        <Tooltip title="Turnos">
                            <div className="icon">
                                <IoTicket size={30}/>
                            </div> 
                        </Tooltip>
                        <span  className="title">Turnos</span>
                    </div>
                    <div id="sub-turn" className={toggleTurn ? 'down-sub' : ''}>
                        <Link to="/admin/turnos/actuales">
                            <div className="sub-option">
                                <Tooltip title="Turnos actuales">
                                    <div className="icon">
                                        <BiCurrentLocation size={30}/>
                                    </div> 
                                </Tooltip>
                                <span  className="title">Actuales</span>
                            </div>
                        </Link>
                        <Link to="/admin/turnos/historicos">
                            <div className="sub-option">
                                <Tooltip title="Turnos Historicos">
                                    <div className="icon">
                                        <BsClockHistory size={30}/>
                                    </div> 
                                </Tooltip>
                                <span  className="title">Historicos</span>
                            </div>
                        </Link>
                        {user && user.rol === 'Admin' &&<Link to="/admin/turnos/reportes">
                            <div className="sub-option">
                                <Tooltip title="Reportes">
                                    <div className="icon">
                                        <HiDocumentReport size={30}/>
                                    </div> 
                                </Tooltip>
                                <span  className="title">Reportes</span>
                            </div>
                        </Link>}
                        <div className="sub-option" onClick={handlerOpenModalSucursal}>
                            <Tooltip title="Re-iniciar turnos">
                                <div className="icon">
                                    <BiReset size={30}/>
                                </div> 
                            </Tooltip>
                            <span  className="title">Re-iniciar</span>
                        </div>
                    </div>
                </div>
                {user && user.rol === 'Admin' && <Link to="/admin/configurations">
                    <div className="option">
                        <Tooltip title="Anuncios">
                            <div className="icon">
                                <FaBuysellads size={30}/>
                            </div> 
                        </Tooltip>
                        <span  className="title">Anuncios</span>
                    </div>
                </Link>}
                <div className="option" onClick={() => {userLogout()}}>
                    <Tooltip title="Cerrar Sesión">
                        <div className="icon">
                            <BiLogOut size={30}/>
                        </div> 
                    </Tooltip>
                    <span  className="title">Cerrar sesión</span>
                </div>
            </div>
        </nav>

        <Dialog open={openModalSuc} onClose={handlerCloseModalSucursal}>
            <DialogTitle>Sucursal donde se reiniciarán los turnos</DialogTitle>
            <DialogContent>
                <Select fullWidth
                        value={selectSucursal}
                        onChange={(e) => {
                            onChangeSucursal(e.target.value);
                        }}
                        label="Sucursal" >
                    {sucursals.map((sucursal, index) =>
                        <MenuItem className="item-combobox" key={index} value={sucursal.name}>{sucursal.name}</MenuItem>
                    )}
                </Select>
            </DialogContent>
            <DialogActions>
                <Button onClick={handlerCloseModalSucursal}>Cancelar</Button>
                <Button onClick={() => {setOpenConfirm(true)}}>Aceptar</Button>
            </DialogActions>
        </Dialog>

        <Confirm 
            open={openConfirm}
            title={'Re-iniciar turnos'} 
            message={`¿Desea realmente realizar el re-inicio de los turnos de ${selectSucursal}?`} 
            handleClose={handleCloseConfirm}
            handleAccept={handleAcceptConfirm}
                />
    </>);
}

export default Menu;