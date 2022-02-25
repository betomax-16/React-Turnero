import { useContext, useState } from "react";
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
import Tooltip from '@mui/material/Tooltip';
import logo from "../../../public/img/logo.png";

function Menu(props) {
    const { userLogout, showAlert, setReset, reset } = useContext(AppContext);
    const [toggleTurn, setToggleTurn] = useState(false);

    const [openConfirm, setOpenConfirm] = useState(false);
    const handleAcceptConfirm = async () => {
        try {
            const urlApi = `http://${window.location.hostname}:4000/api/action/reset`;
            await axios.delete(urlApi, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            setReset(reset+1);
            showAlert("green", 'Re-inicio exitoso.');
        } catch (error) {
            console.log(error);
            showAlert("red", 'algo salio mal');
        }
        setOpenConfirm(false);
    };

    const handleCloseConfirm = () => {
        setOpenConfirm(false);
    };

    return (<>
        <nav className="menu-container">
            <div className="logo">
                <img src={logo} alt="logo"></img>
                {/* <span className="capital">E</span> */}
            </div>
            <div className="options">
                <Link to="/admin/sucursales">
                    <div className="option">
                        <Tooltip title="Sucursales">
                            <div className="icon">
                                <IoStorefront size={30}/>
                            </div>    
                        </Tooltip>
                        <span className="title">Sucursales</span>
                    </div>
                </Link>
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
                <Link to="/admin/areas">
                    <div className="option">
                        <Tooltip title="Areas">
                            <div className="icon">
                                <MdSchema size={30}/>
                            </div> 
                        </Tooltip>
                        <span  className="title">Areas</span>
                    </div>
                </Link>
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
                        <Link to="/admin/turnos/reportes">
                            <div className="sub-option">
                                <Tooltip title="Reportes">
                                    <div className="icon">
                                        <HiDocumentReport size={30}/>
                                    </div> 
                                </Tooltip>
                                <span  className="title">Reportes</span>
                            </div>
                        </Link>
                        <div className="sub-option" onClick={() => {setOpenConfirm(true)}}>
                            <Tooltip title="Re-iniciar turnos">
                                <div className="icon">
                                    <BiReset size={30}/>
                                </div> 
                            </Tooltip>
                            <span  className="title">Re-iniciar</span>
                        </div>
                    </div>
                </div>
                <Link to="/admin/configurations">
                    <div className="option">
                        <Tooltip title="Configuraciones">
                            <div className="icon">
                                <GiGears size={30}/>
                            </div> 
                        </Tooltip>
                        <span  className="title">Configuraciones</span>
                    </div>
                </Link>
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
        <Confirm 
            open={openConfirm}
            title={'Re-iniciar turnos'} 
            message={'¿Desea realmente realizar el re-inicio de los turnos?'} 
            handleClose={handleCloseConfirm}
            handleAccept={handleAcceptConfirm}
                />
    </>);
}

export default Menu;