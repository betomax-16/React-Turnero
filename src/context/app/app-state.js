import React, {useReducer} from 'react';
import { useHistory, useLocation } from "react-router-dom";
import jwt from 'jwt-decode';
import AppReducer from './app-reducer';
import AppContext from './app-context';

const AppState = (props) => {
    const history = useHistory();
    const location = useLocation();
    const initialState = {
        alert: {
            color: '',
            message: '',
            show: false
        },
        reset: 0,
        user: null,
        module: null,
        currentSucursal: null
    };
        
    const [state, dispatch] = useReducer(AppReducer, initialState);

    const showAlert = async(color, message) => {
        dispatch({
            type: 'SET_ALERT',
            payload: {
                color: color,
                message: message,
                show: true
            }
        });
    }

    const hideAlert = async() => {
        dispatch({
            type: 'SET_ALERT',
            payload: {
                show: false
            }
        });
    }

    const getDataUser = () => {
        try {
            const token = localStorage.getItem("token");
            if (token) {
                const user = jwt(token);
                const dateExp = new Date(user.exp);
                const dateNow = new Date().getTime();
                if (dateExp < dateNow / 1000) {
                    showAlert('red', 'Token caducado.');
                    return null;
                }
                return user;
            }
            else {
                return null;
            }
        } catch (error) {
            showAlert('red', 'No se pudo decodificar el token.');
            return null;
        }
    }

    const userLogin = (token) => {
        if (token) {
            localStorage.setItem("token", token);
        }
        
        const user = getDataUser();
        if (user) {
            dispatch({
                type: 'SET_USER',
                payload: { ...user }
            });
            if (!location.pathname.includes('/toma-turno') && !location.pathname.includes('/toma') && !location.pathname.includes('/pantalla')) {
                switch (user.rol.toLowerCase()) {
                    case 'super-admin':
                        history.push('/admin');
                        break;
                    case 'admin':
                        history.push('/admin');
                        break;
                    case 'sub-admin':
                        history.push('/admin');
                        break;
                    case 'vigia':
                        history.push('/vigia');
                        break;
                    case 'recepcionista':
                        history.push('/atencion');
                        break;
                    default:
                        break;
                }
            }
        }
    }

    const userLogout = () => {
        localStorage.removeItem("token");
        dispatch({
            type: 'SET_USER',
            payload: null
        });
        history.push('/login');
    }

    const setReset = (val) => {
        dispatch({
            type: 'SET_RESET',
            payload: val
        });
    }

    const setModule = (val) => {
        dispatch({
            type: 'SET_MODULE',
            payload: val
        });
    }

    const setUser = (val) => {
        dispatch({
            type: 'SET_USER',
            payload: val
        });
    }

    const setCurrentSucursal = (val) => {
        dispatch({
            type: 'SET_CURRENT_SUCURSAL',
            payload: val
        });
    }

    return (
        <AppContext.Provider value={{
            reset: state.reset,
            user: state.user,
            module: state.module,
            currentSucursal: state.currentSucursal,
            alert: state.alert,
            showAlert,
            hideAlert,
            userLogin,
            userLogout,
            getDataUser,
            setReset,
            setModule,
            setUser,
            setCurrentSucursal
        }}>
            {props.children}
        </AppContext.Provider>
    );
};

export default AppState;