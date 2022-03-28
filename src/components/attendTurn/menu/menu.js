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

    const padZero = (str, len) => {
        len = len || 2;
        var zeros = new Array(len).join('0');
        return (zeros + str).slice(-len);
    }

    const invertColor = (hex, bw = true) => {
        if (hex.indexOf('#') === 0) {
            hex = hex.slice(1);
        }
        // convert 3-digit hex to 6-digits.
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length !== 6) {
            throw new Error('Invalid HEX color.');
        }
        var r = parseInt(hex.slice(0, 2), 16),
            g = parseInt(hex.slice(2, 4), 16),
            b = parseInt(hex.slice(4, 6), 16);
        if (bw) {
            // https://stackoverflow.com/a/3943023/112731
            return (r * 0.299 + g * 0.587 + b * 0.114) > 186
                ? '#000000'
                : '#FFFFFF';
        }
        // invert color components
        r = (255 - r).toString(16);
        g = (255 - g).toString(16);
        b = (255 - b).toString(16);
        // pad each with zeros and return
        return "#" + padZero(r) + padZero(g) + padZero(b);
    }

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
        setCurrentSucursal(null);
        props.setConfigSucursal({ color: '#05805e' });
        userLogout();
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
        <nav style={{backgroundColor: props.configSuc.color, color: invertColor(props.configSuc.color)}} className="attendMenu-container">
            <div className="attendMenu-logo">
                <img src={logo} alt="logo"></img>
            </div>
            <div className={props.isModuleFree ? "attendMenu-module center" : "attendMenu-module"}>
                {module && <span className="attendMenu-title" style={{color: invertColor(props.configSuc.color)}}>{currentSucursal||props.sucursal} - {module.name||props.module}</span>}
            </div>
            {!props.isModuleFree && 
                <div className="attendMenu-options">
                    {!currentSucursal && 
                    <div onClick={(e) => openMenu(e, true)} className="attendMenu-button" style={{color: invertColor(props.configSuc.color)}}>
                        <BiSelectMultiple className="icon" size={20}/>
                        <span className="text">Seleccionar sucursal</span>
                    </div>}
                    {currentSucursal && 
                    <div className="attendMenu-button" onClick={props.handlerChangeSucursal} style={{color: invertColor(props.configSuc.color)}}>
                        <FaExchangeAlt className="icon" size={20}/>
                        <span className="text">Cambiar sucursal</span>
                    </div>}
                    {!module && currentSucursal &&
                    <div onClick={(e) => openMenu(e, false)} className="attendMenu-button" style={{color: invertColor(props.configSuc.color)}}>
                        <BiSelectMultiple className="icon" size={20}/>
                        <span className="text">Seleccionar módulo</span>
                    </div>}
                    {module && 
                    <div className="attendMenu-button" onClick={props.handlerChangeModule} style={{color: invertColor(props.configSuc.color)}}>
                        <FaExchangeAlt className="icon" size={20}/>
                        <span className="text">Cambiar módulo</span>
                    </div>}
                    <div className="attendMenu-button" onClick={logout} style={{color: invertColor(props.configSuc.color)}}>
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