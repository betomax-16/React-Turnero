import { useState, useEffect, useContext } from "react";
import AppContext from "../../../context/app/app-context";
import axios from 'axios';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { IoIosSave } from "react-icons/io";
import { useForm, Controller } from "react-hook-form";
import Log from "../../utils/logError/log";
import FilesDragAndDrop from '../../utils/dragAndDrop/dragAndDrop';
import './styles.css';

function Config(props) {
    const { showAlert, getDataUser } = useContext(AppContext);
    const [messageResponse, setMessageResponse] = useState('');
    const [ads, setAds] = useState([]);
    const [preSaveData, setPreSaveData] = useState({});
    const { control, setValue, handleSubmit, watch, formState: { errors } } = useForm({defaultValues:{
        timer: '5',
    }});

    useEffect(() => {
        getData();
        getImages();
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        watch((value, { name, type }) => setMessageResponse(''));
    }, [watch]);

    const onSubmit = data => saveData(data);
    const saveData = async (data) => {
        let url = '';
        const me = getDataUser();
        let bodyRequest = {};
        try {
            const auxData = {
                timer: data.timer * 1000
            };
            bodyRequest = {...auxData};
            url = `http://${window.location.hostname}:4000/api/config`;
            const res = await axios.post(url, auxData, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            res.data.body.timer = data.timer * 1000;
            const dataSave = {
                username: me ? me.username : null,
                source: 'admin',
                action: 'config.js (saveData {post})',
                apiUrl: url,
                bodyBeforeRequest: preSaveData,
                bodyRequest: bodyRequest,
                bodyResponse: res.data
            };
            Log.SendLogAction(dataSave);

            setPreSaveData(bodyRequest);
            showAlert("green", 'Datos actualizados exitosamente.');
        } catch (error) {
            console.log(error);
            if (error.response && error.response.data) {
                showAlert("red", error.response.data.body.message);
                const dataSave = {
                    username: me ? me.username : null,
                    source: 'admin',
                    action: 'config.js (saveData)',
                    apiUrl: url,
                    bodyRequest: bodyRequest,
                    bodyResponse: error.response.data
                };
                Log.SendLogError(dataSave);
            }
            else {
                showAlert("red", 'Ocurrió algún error interno.');
            }
        }
    }

    const getData = async () => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:4000/api/config`, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });
            
            if (res.data.body.length) {
                setValue('timer', res.data.body[0].timer/1000, {
                    shouldValidate: true,
                })
                setPreSaveData({timer: res.data.body[0].timer/1000});
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

    const onUpload = async (files) => {
        const bodyFormData = new FormData();
        for (let index = 0; index < files.length; index++) {
            const file = files[index];
            bodyFormData.append('myFiles', file);
        }
        
        const res = await axios.post(`http://${window.location.hostname}:4000/api/images`, bodyFormData, { 
            headers: {
                'auth': localStorage.getItem('token'),
                "Content-Type": "multipart/form-data"
            }
        });

        if (res.status === 201) {
            getImages();
            if (props.socket) {
                props.socket.emit('updateImages', {});  
            }
        }
        else {
            showAlert("red", 'Ocurrió algún error al subir las imagenes.');
        }
    };

    const onDeleteAd = async (id) => {
        try {
            const res = await axios.delete(`http://${window.location.hostname}:4000/api/images/${id}`, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            console.log(res);
            if (res.status === 204) {
                getImages();
                if (props.socket) {
                    props.socket.emit('updateImages', {});  
                }
            }
            else {
                showAlert("red", 'Ocurrió algún error al eliminar la imagen.');
            }
        } catch (error) {
            console.log(error);
            showAlert("red", 'Ocurrió algún error al eliminar la imagen.');
        }
    }

    const onUpdateAd = async (id, status) => {
        try {
            const res = await axios.put(`http://${window.location.hostname}:4000/api/images/${id}`, {isActive: status}, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            console.log(res);
            if (res.status === 200) {
                const auxAds = [...ads];
                for (let index = 0; index < auxAds.length; index++) {
                    const ad = {...auxAds[index]};
                    if (ad._id === id) {
                        ad.isActive = res.data.body.isActive;
                        auxAds[index] = ad;
                        break;
                    }
                }

                setAds(auxAds);
                if (props.socket) {
                    props.socket.emit('updateImages', {});  
                }
            }
            else {
                showAlert("red", 'Ocurrió algún error al eliminar la imagen.');
            }
        } catch (error) {
            console.log(error);
            showAlert("red", 'Ocurrió algún error al eliminar la imagen.');
        }
    }

    const getImages = async () => {
        const res = await axios.get(`http://${window.location.hostname}:4000/api/images`, { 
            headers: {
                'auth': localStorage.getItem('token')
            }
        });
        if (res.status === 200) {
           console.log(res.data.body.files);
           setAds(res.data.body.files);
        }
    }

    return (<>
        <div className="config-container">
            <h1>Anuncios</h1>
            <FilesDragAndDrop onUpdateAd={onUpdateAd} onDeleteAd={onDeleteAd} onUpload={onUpload} count={12} formats={['.jpeg', '.jpg', '.png']} ads={ads}>
                <h2 className="message">Arrastra tus archivos</h2>
            </FilesDragAndDrop>
            {/* <Tooltip title="Guardar">
                <div className="button-add" onClick={handleSubmit(onSubmit)}>
                    <IoIosSave className="icon" size={25}/>
                </div>
            </Tooltip> */}
            {/* <form className="form-box">
                <Controller
                    name="timer"
                    control={control}
                    render={({ field }) => <TextField 
                                                className="input"
                                                error={errors.timer?.type === 'required'}
                                                helperText={errors.timer ? 'Campo obligatorio.' : ''} 
                                                id="timer" label="Tiempo de turno llamado en pantalla en seg." type="number" margin="dense" variant="standard" fullWidth {...field}/> }
                    rules={{ required: true }}
                />
                {messageResponse !== '' && <span className="messageError">{messageResponse}</span>}
                <Tooltip title="Guardar">
                    <div className="button-add" onClick={handleSubmit(onSubmit)}>
                        <IoIosSave className="icon" size={25}/>
                    </div>
                </Tooltip>
            </form> */}

        </div>
    </>);
}

export default Config;