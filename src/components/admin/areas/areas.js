import { useState, useContext, useEffect } from "react";
import { useForm, Controller  } from "react-hook-form";
import axios from "axios";
import AppContext from "../../../context/app/app-context";
import Confirm from "../../utils/confirm/confirm";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid, esES } from '@mui/x-data-grid';
import { MdModeEdit } from "react-icons/md";
import { AiFillDelete } from "react-icons/ai";
import { BsPlusLg } from "react-icons/bs";
import Log from "../../utils/logError/log";
import './styles.css';

const columns = [
    { field: 'name', headerName: 'Nombre', flex: 1 },
    { field: 'prefix', headerName: 'Prefijo', flex: 1 }
  ];
  


function Areas(props) {
    const [openConfirm, setOpenConfirm] = useState(false);

    const handleAcceptConfirm = async () => {
        let url = '';
        const me = getDataUser();
        let bodyRequest = {};
        try {
            if (areasSelected.length > 0) {
                for (let index = 0; index < areasSelected.length; index++) {
                    const item = areasSelected[index];
                    url = `http://${window.location.hostname}:4000/api/areas/${item.name}`;
                    const res = await axios.delete(url, { 
                        headers: {
                            'auth': localStorage.getItem('token')
                        }
                    });

                    const dataSave = {
                        username: me ? me.username : null,
                        source: 'admin',
                        action: 'areas.js (handleAcceptConfirm {delete})',
                        apiUrl: url,
                        bodyBeforeRequest: item,
                        bodyRequest: {},
                        bodyResponse: res.data
                    };
                    Log.SendLogAction(dataSave);
                }

                showAlert("green", 'Eliminación exitosa.'); 
                getAreas();
                setOpenConfirm(false);
            }
        } catch (error) {
            console.log(error);
            if (error.response && error.response.data) {
                showAlert("red", error.response.data.body.message);
                const dataSave = {
                    username: me ? me.username : null,
                    source: 'admin',
                    action: 'areas.js (handleAcceptConfirm)',
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
        setOpenConfirm(false);
    };

    const handleCloseConfirm = () => {
        setOpenConfirm(false);
    };

    const { control, handleSubmit, setValue, formState: { errors } } = useForm({defaultValues: {
        name: '',
        prefix: ''
    }});

    const [areas, setAreas] = useState([]);
    const [areasSelected, setAreasSelected] = useState([]);
    const [areasSelectedID, setAreasSelectedID] = useState([]);

    useEffect(() => {
        getAreas();
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    const { showAlert, getDataUser } = useContext(AppContext);
    const [open, setOpen] = useState(false);
    const [isNew, setisNew] = useState(true);
    
    const onSubmit = data => callSaveData(data);

    const handleClickOpen = (val) => {
        setisNew(val);
        if (areasSelected.length === 1 && !val) {
            const item = areasSelected[0];
            for (const property in item) {
                setValue(property, item[property], {
                    shouldValidate: true,
                    // shouldDirty: errors.username != null
                })
            }
        }
        else {
            if (areas.length > 0) {
                const item = areas[0];
                
                for (const property in item) {
                    setValue(property, '', {
                        shouldValidate: false,
                    })
                }
            }
        }
        setOpen(true);
    };
    
    const handleClose = () => {
        setOpen(false);
    };

    const callSaveData = async (data) => {
        let url = '';
        const me = getDataUser();
        let bodyRequest = {};
        try {
            const auxData = {...data};
            bodyRequest = {...auxData};
            if (isNew) {
                url = `http://${window.location.hostname}:4000/api/areas`;
                const res = await axios.post(url, auxData, { 
                    headers: {
                        'auth': localStorage.getItem('token')
                    }
                });
                if (res.data.statusCode === 201) {
                    const dataSave = {
                        username: me ? me.username : null,
                        source: 'admin',
                        action: 'areas.js (callSaveData {post})',
                        apiUrl: url,
                        bodyBeforeRequest: {},
                        bodyRequest: bodyRequest,
                        bodyResponse: res.data
                    };
                    Log.SendLogAction(dataSave);

                    showAlert("green", 'Registro exitoso.'); 
                    getAreas();  
                    handleClose();
                }
                else {
                    showAlert("red", res.data.message);   
                }
            }
            else {
                const item = areasSelected[0];
                url = `http://${window.location.hostname}:4000/api/areas/${item.name}`;
                const res = await axios.put(url, auxData, { 
                    headers: {
                        'auth': localStorage.getItem('token')
                    }
                });
                if (res.data.statusCode === 200) {
                    const dataSave = {
                        username: me ? me.username : null,
                        source: 'admin',
                        action: 'areas.js (callSaveData {put})',
                        apiUrl: url,
                        bodyBeforeRequest: item,
                        bodyRequest: bodyRequest,
                        bodyResponse: res.data
                    };
                    Log.SendLogAction(dataSave);

                    showAlert("green", 'Edición exitosa.');  
                    setAreasSelected([]);
                    setAreasSelectedID([]);
                    getAreas(); 
                    handleClose();
                }
                else {
                    showAlert("red", res.data.message);   
                }
            }
        } catch (error) {
            console.log(error);
            if (error.response && error.response.data) {
                showAlert("red", error.response.data.body.message);
                const dataSave = {
                    username: me ? me.username : null,
                    source: 'admin',
                    action: 'areas.js (callSaveData)',
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

    const getAreas = async () => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:4000/api/areas`, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            const rows = [];
            res.data.body.forEach(row => {
                rows.push({
                    id: row._id,
                    name: row.name,
                    prefix: row.prefix
                });
            });

            setAreas(rows);
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

    return (
        <div className="areas-container">
            <h1>Areas</h1>
            <div className="table">
                <DataGrid
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    rows={areas}
                    columns={columns}
                    pageSize={14}
                    rowsPerPageOptions={[14]}
                    checkboxSelection
                    disableSelectionOnClick
                    selectionModel={areasSelectedID}
                    onSelectionModelChange={(ids) => {
                        const auxData = [];
                        ids.forEach(id => {
                            const data = areas.find(item => item.id === id);
                            auxData.push(data);
                        });

                        setAreasSelected(auxData);
                        setAreasSelectedID(ids);
                    }}
                />
            </div>
            <div className="buttons">
                <Tooltip title="Nuevo">
                    <div className="button-add" onClick={() => handleClickOpen(true)}>
                        <BsPlusLg className="icon"/>
                    </div>
                </Tooltip>
                {areasSelected.length === 1 &&
                <Tooltip title="Editar">
                    <div className="button-edit" onClick={() => handleClickOpen(false)}>
                        <MdModeEdit className="icon"/>
                    </div>
                </Tooltip>
                }
                {areasSelected.length >= 1 &&
                <Tooltip title="Eliminar">
                    <div className="button-delete" onClick={() => setOpenConfirm(true)}>
                        <AiFillDelete className="icon"/>
                    </div>
                </Tooltip>
                }
            </div>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{isNew ? 'Nuevo ' : 'Editar '} area</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => <TextField
                                    error={errors.name?.type === 'required'}
                                    helperText={errors.name ? 'Campo obligatorio.' : ''}
                                    autoFocus
                                    margin="dense"
                                    id="name"
                                    label="Nombre"
                                    type="text"
                                    fullWidth
                                    variant="standard"
                                    {...field}
                            />}
                            rules={{ required: true }}
                        />
                        <Controller
                            name="prefix"
                            control={control}
                            render={({ field }) => <TextField
                                    error={errors.prefix?.type === 'required'}
                                    helperText={errors.prefix ? 'Campo obligatorio.' : ''}
                                    autoFocus
                                    margin="dense"
                                    id="prefix"
                                    label="Prefijo"
                                    type="text"
                                    fullWidth
                                    variant="standard"
                                    {...field}
                            />}
                            rules={{ required: true }}
                        />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button type="submit" >Guardar</Button>
                </DialogActions>
                </form>
            </Dialog>

            <Confirm 
                open={openConfirm}
                title={'Eliminar Areas'} 
                message={'¿Desea realmente realizar la eliminación?'} 
                handleClose={handleCloseConfirm}
                handleAccept={handleAcceptConfirm}
                 />
        </div>
    );
}

export default Areas;