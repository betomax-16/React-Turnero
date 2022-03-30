import { useState, useEffect, useContext } from "react";
import { useForm, Controller  } from "react-hook-form";
import { Link } from "react-router-dom";
import AppContext from "../../../context/app/app-context";
import axios from "axios";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import { DataGrid, esES } from '@mui/x-data-grid';
import { ChromePicker  } from 'react-color';
import Log from "../../utils/logError/log";
import './styles.css';

// const protocol = window.location.protocol;
// const host = window.location.host;

function Sucursales(props) {
    const columns = [
        { field: 'sucursal', headerName: 'Sucursal', flex: 1 },
        { field: 'url', headerName: 'Toma turno', flex: 1,
            renderCell: (params) => (
               <Link className="button-link" to={`/toma-turno/${params.value}`} target={'_blank'}>
                   Abrir Toma Turno
               </Link> 
        ),},
        { field: 'urlScreen', headerName: 'Pantalla', flex: 1,
            renderCell: (params) => (<>
               <Link className="button-link" to={`/pantalla/${params.value}`} target={'_blank'}>
                   Abrir Pantalla
               </Link>
               <div className="button-associate" onClick={async () => {
                    if (props.socket) {
                        const sucursal = window.atob(params.value);
                        props.socket.emit('refresh', {sucursal: sucursal, module: 'screen'});
                    }
               }}>
                   Actualizar
               </div> 
            </>
        ),},
        { field: 'associate', headerName: 'Asociar', flex: 1,
            renderCell: (params) => (
               <div className="button-associate" onClick={async () => {
                    const sucursal = params.value;
                    setSucursalSelected(sucursal);
                    await getAreasBySucursal(sucursal);
                    setOpen(true);
               }}>
                   Asociar Areas
               </div> 
        ),},
        { field: 'config', headerName: 'Configuración', flex: 1,
            renderCell: (params) => (
                <div className="button-associate" onClick={async () => {
                    try {
                        const sucursal = params.value.name;
                        setSucursalSelected(sucursal);
                        const res = await axios.get(`http://${window.location.hostname}:4000/api/sucursal/${sucursal}`, { 
                            headers: {
                                'auth': localStorage.getItem('token')
                            }
                        }); 
            
                        let existPrint = false;
                        let existMessageTicket = false;
                        setPreSaveData(res.data.body);
                        for (const property in res.data.body) {
                            setValue(property, res.data.body[property], {
                                shouldValidate: true
                            });

                            if (property === 'color') {
                                setColor({hex: res.data.body[property]});
                            }

                            if (property === 'print') {
                                existPrint = true;
                            }

                            if (property === 'messageTicket') {
                                existMessageTicket = true;
                            }
                        }

                        if (!existPrint) {
                            setValue("print", '');
                        }

                        if (!existMessageTicket) {
                            setValue("messageTicket", '');
                        }
                        
                        setOpenConfig(true);
                    } catch (error) {
                        console.log(error);
                        if (error.response && error.response.data) {
                            showAlert("red", error.response.data.body.message);
                        }
                        else {
                            showAlert("red", 'Ocurrió algún error interno.');
                        }
                    }
               }}>
                   Configurar
               </div> 
        ),},
    ];

    const { control, handleSubmit, setValue, formState: { errors } } = useForm({defaultValues: {
        color: '',
        timeLimit: 0,
        print: '',
        messageTicket: ''
    }});
    const onSubmit = data => handleSaveConfig(data);

    const [sucursalSelected, setSucursalSelected] = useState(null);
    const { showAlert, getDataUser } = useContext(AppContext);
    const [open, setOpen] = useState(false);
    const [openConfig, setOpenConfig] = useState(false);
    const [sucursals, setSucursals] = useState([]);
    const [areas, setAreas] = useState([]);
    const [color, setColor] = useState({hex: "#782929"});

    const [copyAreasSucursal, setCopyAreasSucursal] = useState({});
    const [areasSucursal, setAreasSucursal] = useState({});

    const [preSaveData, setPreSaveData] = useState({});

    useEffect(() => {
        getSucursals();
        getAreas();
        console.log(props.socket);
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    const getSucursals = async () => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:4000/api/sucursal`, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });
            const auxData = [];
            
            res.data.body.forEach(element => {
                auxData.push({ 
                    id: element._id,
                    sucursal: element.name, 
                    url: btoa(element.name),
                    urlScreen: btoa(element.name),
                    associate: element.name,
                    config: {
                        name: element.name,
                        color: element.color,
                        timeLimit: element.timeLimit
                    }
                });                
            });

            const auxSucursals = auxData.sort(( a, b ) => {
                if ( a.sucursal < b.sucursal ){
                  return -1;
                }
                if ( a.sucursal > b.sucursal ){
                  return 1;
                }
                return 0;
            });

            setSucursals(auxSucursals);
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

    const getAreas = async () => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:4000/api/areas`, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });
            const auxData = [];
            const auxSelectAreas = {};
            
            res.data.body.forEach(element => {
                auxData.push({ 
                    name: element.name
                });

                auxSelectAreas[element.name] = false;
            });

            setAreas(auxData);
            setAreasSucursal(auxSelectAreas);
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

    const getAreasBySucursal = async (sucursal) => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:4000/api/area-sucursal/${sucursal}`, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            const areasReturn = { ...areasSucursal };
            const auxData = [];
            res.data.body.forEach(element => {
                auxData[element.area] = 
                auxData.push({ 
                    area: element.area
                });
            });

            areas.forEach(area => {
                const found = auxData.find(element => element.area === area.name);  
                areasReturn[area.name] = found !== undefined;
            });

            setAreasSucursal(areasReturn);
            setCopyAreasSucursal(areasReturn);

            setPreSaveData(areasReturn);
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

    const handleCheckAll = (event) => {
        const dataAux = { ...areasSucursal };
        for (const property in dataAux) {
            dataAux[property] = event.target.checked;
        }

        setAreasSucursal(dataAux);
    }

    const handleCheckArea = (area, value) => {
        const auxData = { ...areasSucursal };
        auxData[area] = value;

        setAreasSucursal(auxData);
    }

    const handleClose = () => {
        setSucursalSelected(null);
        setOpen(false);
    };

    const handleSave = () => {
        const deleteRow = [];
        const insertRow = [];
        for (const property in copyAreasSucursal) {
            if (copyAreasSucursal[property] !== areasSucursal[property]) {
                if (areasSucursal[property]) {
                    insertRow.push({area: property, sucursal: sucursalSelected});
                }
                else {
                    deleteRow.push({area: property, sucursal: sucursalSelected});
                }
            }
        }


        let url = '';
        let data = {};
        const user = getDataUser();
        try {
            if (deleteRow.length > 0) {
                deleteRow.forEach(async element => {
                    url = `http://${window.location.hostname}:4000/api/area-sucursal/${element.sucursal}/${element.area}`;
                    const myUrl = url.slice(0, url.length);
                    const res = await axios.delete(url, { 
                        headers: {
                            'auth': localStorage.getItem('token')
                        }
                    }); 

                    const dataSave = {
                        username: user ? user.username : null,
                        source: 'admin',
                        action: 'sucursales.js (handleSave [Asociar areas {delete}])',
                        apiUrl: myUrl,
                        bodyBeforeRequest: preSaveData,
                        bodyRequest: {},
                        bodyResponse: res.data
                    };
                    Log.SendLogAction(dataSave);
                });
            }
    
            if (insertRow.length > 0) {
                insertRow.forEach(async element => {
                    data = element;
                    url = `http://${window.location.hostname}:4000/api/area-sucursal`;
                    const myUrl = url.slice(0, url.length);
                    const res = await axios.post(url, element, { 
                        headers: {
                            'auth': localStorage.getItem('token')
                        }
                    });
                    
                    const dataSave = {
                        username: user ? user.username : null,
                        source: 'admin',
                        action: 'sucursales.js (handleSave [Asociar areas {post}])',
                        apiUrl: myUrl,
                        bodyBeforeRequest: preSaveData,
                        bodyRequest: data,
                        bodyResponse: res.data
                    };
                    Log.SendLogAction(dataSave);
                });  
            }

            setOpen(false);
            setPreSaveData({});
            showAlert("green", "Cambios exitosos.");
        } catch (error) {
            console.log(error);
            if (error.response && error.response.data) {
                showAlert("red", error.response.data.body.message);
                const dataSave = {
                    username: user ? user.username : null,
                    source: 'admin',
                    action: 'sucursales.js (handleSave [Asociar areas])',
                    apiUrl: url,
                    bodyRequest: data,
                    bodyResponse: error.response.data
                };
                Log.SendLogError(dataSave);
            }
            else {
                showAlert("red", 'Ocurrió algún error interno.');
            }
        }
    }

    const printCheckBox = () =>  {
        const result = [];
        let index = 0;
        for (const property in areasSucursal) {
            result.push(<FormControlLabel key={index} control={<Checkbox onChange={(e) => handleCheckArea(property, e.target.checked)} checked={areasSucursal[property]} />} label={property} />);
            index++;
        }

        return result;
    }

    const handleCloseConfig = () => {
        setSucursalSelected(null);
        setOpenConfig(false);
    };

    const handleSaveConfig = async (data) => {
        let url = `http://${window.location.hostname}:4000/api/sucursal/${data.name}`;
        let bodyRequest = {};
        const user = getDataUser();
        try {
            const req = {
                color: data.color,
                timeLimit: data.timeLimit,
                print: data.print,
                messageTicket: data.messageTicket
            };
            bodyRequest = req;
            const res = await axios.put(url, req, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            }); 

            const dataSave = {
                username: user ? user.username : null,
                source: 'admin',
                action: 'sucursales.js (handleSaveConfig [Configuracion de sucursal])',
                apiUrl: url,
                bodyBeforeRequest: preSaveData,
                bodyRequest: bodyRequest,
                bodyResponse: res.data
            };
            Log.SendLogAction(dataSave);

            setOpenConfig(false);
            setPreSaveData({});
            showAlert("green", "Cambios exitosos.");
        } catch (error) {
            console.log(error);
            if (error.response && error.response.data) {
                showAlert("red", error.response.data.body.message);
                const dataSave = {
                    username: user ? user.username : null,
                    source: 'admin',
                    action: 'sucursales.js (handleSaveConfig [Configuracion de sucursal])',
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

    const handleChangeColor = (color) => {
        setValue("color", color.hex);
        setColor(color);
    };
    return (<>
        <div className="sucursal-container">
            <h1>Sucursales</h1>
            <div className="table">
                <DataGrid
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    rows={sucursals}
                    columns={columns}
                    pageSize={14}
                    rowsPerPageOptions={[14]}
                    disableSelectionOnClick
                />
            </div>
        </div>
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>
                <Checkbox onChange={handleCheckAll}/>
                Areas en: {sucursalSelected}
            </DialogTitle>
            <DialogContent>
                <FormGroup>
                    {printCheckBox()}
                </FormGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar</Button>
            </DialogActions>
        </Dialog>

        <Dialog open={openConfig} onClose={handleCloseConfig}>
            <DialogTitle>
                Configuración para: {sucursalSelected}
            </DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent>
                <div className="content-modal-sucursal">
                    <ChromePicker color={color} onChange={handleChangeColor}/>
                    <FormGroup>
                        <Controller
                                    name="color"
                                    control={control}
                                    render={({ field }) => <TextField
                                            disabled
                                            error={errors.color?.type === 'required'}
                                            helperText={errors.color ? 'Campo obligatorio.' : ''}
                                            autoFocus
                                            margin="dense"
                                            id="color"
                                            label="Color"
                                            type="text"
                                            fullWidth
                                            variant="standard"
                                            {...field}
                                    />}
                                    rules={{ required: true }}
                                />
                        <Controller
                                    name="timeLimit"
                                    control={control}
                                    render={({ field }) => <TextField
                                            error={errors.timeLimit?.type === 'required'}
                                            helperText={errors.timeLimit ? 'Campo obligatorio.' : ''}
                                            margin="dense"
                                            id="timeLimit"
                                            label="Tiempo Limite de espera (min.)"
                                            type="number"
                                            InputProps={{ inputProps: { min: 0 } }}
                                            fullWidth
                                            variant="standard"
                                            {...field}
                                    />}
                                    rules={{ required: true }}
                                />
                        <Controller
                                    name="print"
                                    control={control}
                                    render={({ field }) => <TextField
                                            margin="dense"
                                            id="print"
                                            label="Impresora"
                                            type="text"
                                            fullWidth
                                            variant="standard"
                                            {...field}
                                    />}
                                />
                        <Controller
                                    name="messageTicket"
                                    control={control}
                                    render={({ field }) => <TextField
                                            margin="dense"
                                            id="print"
                                            label="Mensaje en el turno"
                                            type="text"
                                            fullWidth
                                            variant="standard"
                                            {...field}
                                    />}
                                />
                    </FormGroup>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseConfig}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
            </DialogActions>
            </form>
        </Dialog>
    </>);
}

export default Sucursales;