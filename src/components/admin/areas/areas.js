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
import './styles.css';

const columns = [
    { field: 'name', headerName: 'Nombre', flex: 1 },
    { field: 'prefix', headerName: 'Prefijo', flex: 1 }
  ];
  


function Areas(props) {
    const [openConfirm, setOpenConfirm] = useState(false);

    const handleAcceptConfirm = async () => {
        try {
            if (areasSelected.length > 0) {
                for (let index = 0; index < areasSelected.length; index++) {
                    const item = areasSelected[index];
                    await axios.delete(`http://localhost:4000/api/areas/${item.name}`, { 
                        headers: {
                            'auth': localStorage.getItem('token')
                        }
                    });
                }

                showAlert("green", 'Eliminación exitosa.'); 
                getAreas();
                setOpenConfirm(false);
            }
        } catch (error) {
            console.log(error);
            showAlert("red", 'algo salio mal');
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

    const { showAlert } = useContext(AppContext);
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
        try {
            const auxData = {...data};
            if (isNew) {
                const res = await axios.post(`http://localhost:4000/api/areas`, auxData, { 
                    headers: {
                        'auth': localStorage.getItem('token')
                    }
                });
                if (res.data.statusCode === 201) {
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
                const res = await axios.put(`http://localhost:4000/api/areas/${item.name}`, auxData, { 
                    headers: {
                        'auth': localStorage.getItem('token')
                    }
                });
                if (res.data.statusCode === 200) {
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
            showAlert("red", 'algo salio mal');
        }
    }

    const getAreas = async () => {
        try {
            const res = await axios.get(`http://localhost:4000/api/areas`, { 
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