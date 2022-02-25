import { useState, useEffect, useContext } from "react";
import { useForm, Controller } from "react-hook-form";
import TextField from '@mui/material/TextField';
import axios from 'axios';
import AppContext from "../../context/app/app-context";
import logo from '../../public/img/logo.png';
import RequireNoAuth from "../utils/auth/RequireNoAuth";
import './styles.css';

function Login() {
  const { showAlert, userLogin } = useContext(AppContext);
  const [messageResponse, setMessageResponse] = useState('');
  const { control, handleSubmit, watch, formState: { errors } } = useForm({defaultValues:{
    username: '',
    password: ''
  }});
  const onSubmit = data => callCheckLogin(data);

  useEffect(() => {
    watch((value, { name, type }) => setMessageResponse(''));
  }, [watch]);

  const callCheckLogin = async (data) => {
    try {
      const res = await axios.post(`http://${window.location.hostname}:4000/api/login`, data);
      userLogin(res.data.body.token);
      // const user = getDataUser();
      // history.push('/atencion')
    } catch (error) {
      if (error.response && error.response.data) {
        console.log(error.response.data);
        setMessageResponse(error.response.data.body.message); 
      }
      else {
        console.log(error);
        showAlert("red", 'Ocurrio algun error interno.');
      }
    }
  };

  return (
    <RequireNoAuth>
      <div className="login-container">
        <form className="login-box" onSubmit={handleSubmit(onSubmit)}>
          <div className="login-header">
            <img src={logo} alt="logo"></img>
          </div>
          <div className="login-body">
            <h1>Bienvenido</h1>
            <Controller
                name="username"
                control={control}
                render={({ field }) => <TextField 
                                            error={errors.username?.type === 'required'}
                                            helperText={errors.username ? 'Campo obligatorio.' : ''} 
                                            id="username" label="Username" type="text" margin="dense" variant="standard" fullWidth autoFocus {...field}/> }
                rules={{ required: true }}
            />
            <Controller
                name="password"
                control={control}
                render={({ field }) => <TextField 
                                            error={errors.password?.type === 'required'}
                                            helperText={errors.password ? 'Campo obligatorio.' : ''} 
                                            id="password" label="Contraseña" type="password" margin="dense" variant="standard" fullWidth {...field}/> }
                rules={{ required: true }}
            />
            {messageResponse !== '' && <span className="messageError">{messageResponse}</span>}
            <input type="submit" className="login-button" value="Acceder" />
          </div>
        </form>
      </div>
    </RequireNoAuth>
  );
}

export default Login;
