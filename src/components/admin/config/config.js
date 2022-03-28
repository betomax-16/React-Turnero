import { useState, useEffect, useContext } from "react";
import AppContext from "../../../context/app/app-context";
import axios from 'axios';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { IoIosSave } from "react-icons/io";
import { useForm, Controller } from "react-hook-form";
import './styles.css';

function Config(props) {
    const { showAlert } = useContext(AppContext);
    const [messageResponse, setMessageResponse] = useState('');
    const { control, setValue, handleSubmit, watch, formState: { errors } } = useForm({defaultValues:{
        timer: '5',
    }});

    useEffect(() => {
        getData();
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        watch((value, { name, type }) => setMessageResponse(''));
    }, [watch]);

    const onSubmit = data => saveData(data);
    const saveData = async (data) => {
        try {
            const auxData = {
                timer: data.timer * 1000
            };
            await axios.post(`http://${window.location.hostname}:4000/api/config`, auxData, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });
            showAlert("green", 'Datos actualizados exitosamente.');
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

    return (<>
        <div className="config-container">
            <h1>Configuraciones</h1>
            <form className="form-box">
                <Controller
                    name="timer"
                    control={control}
                    render={({ field }) => <TextField 
                                                className="input"
                                                error={errors.timer?.type === 'required'}
                                                helperText={errors.timer ? 'Campo obligatorio.' : ''} 
                                                id="timer" label="Tiempo de timbre en pantalla en seg." type="number" margin="dense" variant="standard" fullWidth {...field}/> }
                    rules={{ required: true }}
                />
                {messageResponse !== '' && <span className="messageError">{messageResponse}</span>}
                <Tooltip title="Guardar">
                    <div className="button-add" onClick={handleSubmit(onSubmit)}>
                        <IoIosSave className="icon" size={25}/>
                    </div>
                </Tooltip>
            </form>
        </div>
    </>);
}

export default Config;