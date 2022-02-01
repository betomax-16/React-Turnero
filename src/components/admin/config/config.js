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
        timer: '5000',
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
            await axios.post(`http://localhost:4000/api/config`, data, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });
            showAlert("green", 'Datos actualizados exitosamente.');
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

    const getData = async () => {
        try {
            const res = await axios.get(`http://localhost:4000/api/config`, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });
            
            if (res.data.body.length) {
                setValue('timer', res.data.body[0].timer, {
                    shouldValidate: true,
                })
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
                {/* <input type="submit" className="save-button" value="Guardar" /> */}
            </form>
        </div>
    </>);
}

export default Config;