import { useContext, useEffect, useState } from "react";
import AppContext from "../../../context/app/app-context";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import { BiLogOut, BiSelectMultiple } from "react-icons/bi";
import { FaExchangeAlt } from "react-icons/fa";
import './styles.css';
import logo from '../../../public/img/logo.png';

function AttendMenu(props) {
    const { userLogout, module, setCurrentSucursal, currentSucursal } = useContext(AppContext);
    const [anchorEl, setAnchorEl] = useState(null);
    const [isSucursal, setIsSursal] = useState(false);
    const [valueSelect, setValueSelect] = useState('');

    useEffect(() => {
        if (isSucursal) {
            setValueSelect(props.sucursalSelect);
        }
        else {
            setValueSelect(props.moduleSelect);
        }
    }, [isSucursal]); // eslint-disable-line react-hooks/exhaustive-deps

    // -------------------------------------------------------------
    //                        OPEN MENU FILTER
    // -------------------------------------------------------------
    const open = Boolean(anchorEl);
    const openMenu = (event, flagSucursal) => {
        setIsSursal(flagSucursal);
        setAnchorEl(event.currentTarget);
    }

    const closeMenu = () => {
        setAnchorEl(null);
    };

    const logout = async () => {
        if (module) {
            await props.updateStateModule('', true);
        }
        userLogout();
        setCurrentSucursal(null);
    }

    const handlerChangeOption = (e) => {
        if (isSucursal) {
            props.handlerChangeSucursalSelect(e);
        }
        else {
            props.handlerChangeModuleSelect(e);
        }
        setValueSelect(e.target.value);
    };

    const handlerOk = (e) =>  {
        if (isSucursal) {
            props.handlerOkSucursalSelect(e);    
        }
        else {
            props.handlerOkModuleSelect(e);
        }
        setAnchorEl(null);
    }

    return (<>
        <nav className="attendMenu-container">
            <div className="attendMenu-logo">
                <img src={logo} alt="logo"></img>
            </div>
            <div className={props.isModuleFree ? "attendMenu-module center" : "attendMenu-module"}>
                {module && <span className="attendMenu-title">{module.name}</span>}
            </div>
            {!props.isModuleFree && 
                <div className="attendMenu-options">
                    {!currentSucursal && 
                    <div onClick={(e) => openMenu(e, true)} className="attendMenu-button">
                        <BiSelectMultiple className="icon" size={20}/>
                        <span className="text">Seleccionar sucursal</span>
                    </div>}
                    {currentSucursal && 
                    <div className="attendMenu-button" onClick={props.handlerChangeSucursal}>
                        <FaExchangeAlt className="icon" size={20}/>
                        <span className="text">Cambiar sucursal</span>
                    </div>}
                    {!module && currentSucursal &&
                    <div onClick={(e) => openMenu(e, false)} className="attendMenu-button">
                        <BiSelectMultiple className="icon" size={20}/>
                        <span className="text">Seleccionar módulo</span>
                    </div>}
                    {module && 
                    <div className="attendMenu-button" onClick={props.handlerChangeModule}>
                        <FaExchangeAlt className="icon" size={20}/>
                        <span className="text">Cambiar módulo</span>
                    </div>}
                    <div className="attendMenu-button" onClick={logout}>
                        <BiLogOut className="attendMenu-icon" size={20}/> 
                        <span className="text">Cerrar sesión</span>
                    </div>
                </div>
            }
        </nav>
        {!props.isModuleFree && <> 
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={closeMenu}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                    <div className="menu-modules-container">
                        <FormControl variant="standard" sx={{ m: 1, minWidth: 200 }}>
                            <InputLabel id="module-label">{isSucursal ? 'Sucursal' : 'Módulo'}</InputLabel>
                            <Select
                                onChange={handlerChangeOption}
                                value={valueSelect}
                                labelId="module-label"
                                id="module"
                            >
                                {isSucursal ?
                                    props.sucursals.map((item, index)=> <MenuItem key={index} value={item.name}>{item.name}</MenuItem>) :
                                    props.modules.map((item, index)=> <MenuItem key={index} value={item.name}>{item.name}</MenuItem>)
                                }
                            </Select>
                        </FormControl>
                        <div onClick={handlerOk} className="menu-btn-ok">Aceptar</div>
                    </div>
            </Menu>
        </>}
    </>);
}

export default AttendMenu;