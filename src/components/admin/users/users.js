import { useState, useContext, useEffect } from "react";
import { useForm, Controller  } from "react-hook-form";
import axios from "axios";
import AppContext from "../../../context/app/app-context";
import Confirm from "../../utils/confirm/confirm";
import FilterMenu from "../../utils/filter/filter";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid, esES } from '@mui/x-data-grid';
import { MdModeEdit } from "react-icons/md";
import { AiFillDelete } from "react-icons/ai";
import { BsPlusLg } from "react-icons/bs";
import { FaFilter } from "react-icons/fa";
import { getOperatorMongo } from "../../../utils/operatorsMongoQuery";
import './styles.css';

const columns = [
    { field: 'username', headerName: 'Username', flex: 1, mytype: 'string' },
    { field: 'name', headerName: 'Nombre', flex: 1, mytype: 'string' },
    { field: 'firstLastName', headerName: 'Apellido Paterno', flex: 1, mytype: 'string' },
    { field: 'secondLastName', headerName: 'Apellido Materno', flex: 1, mytype: 'string' },
    { field: 'sucursal', headerName: 'Sucursal', flex: 1, mytype: 'string' },
    { field: 'rol', headerName: 'Rol', flex: 1, mytype: 'string' }
  ];
  


function Users(props) {
    const urlUsers = `http://${window.location.hostname}:4000/api/users`;
    const [openConfirm, setOpenConfirm] = useState(false);

    const handleAcceptConfirm = async () => {
        try {
            if (usersSelected.length > 0) {
                for (let index = 0; index < usersSelected.length; index++) {
                    const user = usersSelected[index];
                    await axios.delete(`http://${window.location.hostname}:4000/api/users/${user.username}`, { 
                        headers: {
                            'auth': localStorage.getItem('token')
                        }
                    });
                }

                showAlert("green", 'Eliminación exitosa.'); 
                getUsers();
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
        username: '',
        name: '',
        firstLastName: '',
        secondLastName: '',
        rol: '',
        sucursal: '',
        password: ''
    }});

    const [sucursals, setSucursals] = useState([]);
    const [roles, setRoles] = useState([]);


    const [users, setUsers] = useState([]);
    const [usersSelected, setUsersSelected] = useState([]);
    const [usersSelectedID, setUsersSelectedID] = useState([]);

    useEffect(() => {
        getSucursals();
        getRoles();
        getUsers();
    }, []);// eslint-disable-line react-hooks/exhaustive-deps


    


    const { showAlert } = useContext(AppContext);
    const [open, setOpen] = useState(false);
    const [isNew, setisNew] = useState(true);
    
    const onSubmit = data => callSaveData(data);

    const handleClickOpen = (val) => {
        setisNew(val);
        if (usersSelected.length === 1 && !val) {
            const user = usersSelected[0];
            for (const property in user) {
                setValue(property, user[property], {
                    shouldValidate: true,
                    // shouldDirty: errors.username != null
                })
            }
        }
        else {
            if (users.length > 0) {
                const user = users[0];
                setValue('password', '', {
                    shouldValidate: false,
                });

                for (const property in user) {
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
            if (isNew) {
                const res = await axios.post(`http://${window.location.hostname}:4000/api/users`, data, { 
                    headers: {
                        'auth': localStorage.getItem('token')
                    }
                });
                if (res.data.statusCode === 201) {
                    showAlert("green", 'Registro exitoso.'); 
                    getUsers();  
                    handleClose();
                }
                else {
                    showAlert("red", res.data.message);   
                }
            }
            else {
                const res = await axios.put(`http://${window.location.hostname}:4000/api/users/${data.username}`, data, { 
                    headers: {
                        'auth': localStorage.getItem('token')
                    }
                });
                if (res.data.statusCode === 200) {
                    showAlert("green", 'Edición exitosa.');  
                    setUsersSelected([]);
                    setUsersSelectedID([]);
                    getUsers(); 
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

    const getSucursals = async () => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:5000/api/sucursal`);
            setSucursals(res.data.body);
        } catch (error) {
            if (error.response.data) {
                console.log(error.response.data);
                showAlert("red", error.response.data.body.message); 
            }
            else {
                console.log(error);
                showAlert("red", 'Ocurrio algun error interno.');
            }
        }
    }

    const getRoles = async () => {
        try {
            const res = await axios.get(`http://${window.location.hostname}:4000/api/roles`, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });
            setRoles(res.data.body);
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

    const getUsers = async (url = '') => {
        try {
            const urlApi = url !== '' ? url : urlUsers;
            const res = await axios.get(urlApi, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            const rows = [];
            res.data.body.forEach(row => {
                rows.push({
                    id: row._id,
                    username: row.username,
                    name: row.name,
                    firstLastName: row.firstLastName,
                    secondLastName: row.secondLastName,
                    sucursal: row.sucursal,
                    rol: row.rol
                });
            });

            setUsers(rows);
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

    // -------------------------------------------------------------
    //                        OPEN MENU FILTER
    // -------------------------------------------------------------
    const [anchorEl, setAnchorEl] = useState(null);
    const open_menu = Boolean(anchorEl);
    const openMenu = (event) => {
        setAnchorEl(event.currentTarget);
    }
    const closeMenu = () => {
        setAnchorEl(null);
    };

    // -------------------------------------------------------------
    //                  STATES FILTERS & COLUMNS
    // -------------------------------------------------------------
    const [indexFilter, setIndexFilter] = useState(0);
    const [filters, setFilters] = useState([
        {
            index: indexFilter,
            field: columns[0].field,
            operator: '%',
            value: ''
        }
    ]);

    useEffect(() => {
        let query = '?';
        filters.forEach(filter => {
            const op = getOperatorMongo(filter.operator);
            const logicOp = filter.logicOperator !== undefined ? `|${filter.logicOperator}` : '';
            query += `${filter.field}=${filter.value}|${op}${logicOp}&`
        });
        query = query.substring(0, query.length - 1);

        let auxUrlUsers = urlUsers;
        auxUrlUsers += query;
        getUsers(auxUrlUsers);

    }, [filters]);// eslint-disable-line react-hooks/exhaustive-deps

    const addFilter = () => {
        let auxIndex = indexFilter;
        auxIndex++;
        const auxData = [ ...filters ];

        const filter = {
            index: auxIndex,
            logicOperator: 'and',
            field: columns[0].field,
            operator: '=',
            value: ''
        };

        if (auxData.length === 0) {
            delete filter.logicOperator;
        }

        auxData.push(filter);

        setFilters(auxData);
        setIndexFilter(auxIndex);
    }

    const removeFilter = (index) => {
        const auxData = [ ...filters ];
        const removeIndex = auxData.map(item => item.index).indexOf(index);
        if (removeIndex !== -1) {
            if (removeIndex === 0) {
                if (auxData.length > 1) {
                    delete auxData[1].logicOperator;
                }
                auxData.splice(removeIndex, 1);
            }
            else {
                auxData.splice(removeIndex, 1);
            }
        }

        setFilters(auxData);
    }

    const handlerChangeSelectColumn = (event, index) => {
        const auxData = [ ...filters ];
        const editIndex = auxData.map(item => item.index).indexOf(index);
        if (editIndex !== -1) {
            auxData[editIndex].field = event.target.value;
        }

        setFilters(auxData);
    };

    const handlerChangeSelectOperator = (event, index) => {
        const auxData = [ ...filters ];
        const editIndex = auxData.map(item => item.index).indexOf(index);
        if (editIndex !== -1) {
            auxData[editIndex].operator = event.target.value;
        }

        setFilters(auxData);
    };

    const handlerChangeValue = (event, index) => {
        const auxData = [ ...filters ];
        const editIndex = auxData.map(item => item.index).indexOf(index);
        if (editIndex !== -1) {
            auxData[editIndex].value = event.target.value;
        }

        setFilters(auxData);
    };

    const handlerChangeSelectLogicOperator = (event, index) => {
        const auxData = [ ...filters ];
        const editIndex = auxData.map(item => item.index).indexOf(index);
        if (editIndex !== -1) {
            auxData[editIndex].logicOperator = event.target.value;
        }

        setFilters(auxData);
    };

    return (<>
        <div className="users-container">
            <h1>Usuarios</h1>
            <div className="table">
                <DataGrid
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    rows={users}
                    columns={columns}
                    pageSize={14}
                    disableColumnMenu={true}
                    rowsPerPageOptions={[14]}
                    disableSelectionOnClick
                    checkboxSelection
                    selectionModel={usersSelectedID}
                    onSelectionModelChange={(ids) => {
                        const auxUsers = [];
                        ids.forEach(id => {
                            const user = users.find(item => item.id === id);
                            auxUsers.push(user);
                        });

                        setUsersSelected(auxUsers);
                        setUsersSelectedID(ids);
                    }}
                />
            </div>
            <Tooltip title="Filtros">
                <div onClick={openMenu} className="button-filter">
                    <FaFilter className="icon"/>
                </div>
            </Tooltip>
            <div className="buttons">
                <Tooltip title="Nuevo">
                    <div className="button-add" onClick={() => handleClickOpen(true)}>
                        <BsPlusLg className="icon"/>
                    </div>
                </Tooltip>
                {usersSelected.length === 1 &&
                <Tooltip title="Editar">
                    <div className="button-edit" onClick={() => handleClickOpen(false)}>
                        <MdModeEdit className="icon"/>
                    </div>
                </Tooltip>
                }
                {usersSelected.length >= 1 &&
                <Tooltip title="Eliminar">
                    <div className="button-delete" onClick={() => setOpenConfirm(true)}>
                        <AiFillDelete className="icon"/>
                    </div>
                </Tooltip>
                }
            </div>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{isNew ? 'Nuevo ' : 'Editar '} usuario</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                        <Controller
                            name="username"
                            control={control}
                            render={({ field }) => <TextField
                                    error={errors.username?.type === 'required'}
                                    helperText={errors.username ? 'Campo obligatorio.' : ''}
                                    inputProps={{ readOnly: !isNew }}
                                    autoFocus
                                    margin="dense"
                                    id="username"
                                    label="Username"
                                    type="text"
                                    fullWidth
                                    variant="standard"
                                    {...field}
                            />}
                            rules={{ required: true }}
                        />
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => <TextField 
                                                        error={errors.name?.type === 'required'}
                                                        helperText={errors.name ? 'Campo obligatorio.' : ''} 
                                                        inputProps={{ readOnly: !isNew }}
                                                        id="name" label="Nombre" type="text" margin="dense" variant="standard" fullWidth {...field}/> }
                            rules={{ required: true }}
                        />
                        <Controller
                            name="firstLastName"
                            control={control}
                            render={({ field }) => <TextField 
                                                        error={errors.firstLastName?.type === 'required'}
                                                        helperText={errors.firstLastName ? 'Campo obligatorio.' : ''} 
                                                        inputProps={{ readOnly: !isNew }}
                                                        id="firstLastName" label="Apellido Paterno" type="text" margin="dense" variant="standard" fullWidth {...field}/> }
                            rules={{ required: true }}
                        />
                        <Controller
                            name="secondLastName"
                            control={control}
                            render={({ field }) => <TextField 
                                                        error={errors.firstLastName?.type === 'required'}
                                                        helperText={errors.secondLastName ? 'Campo obligatorio.' : ''}
                                                        inputProps={{ readOnly: !isNew }}
                                                        id="secondLastName" label="Apellido Materno" type="text" margin="dense" variant="standard" fullWidth {...field}/> }
                            rules={{ required: true }}
                        />
                        <Controller
                            name="sucursal"
                            control={control}
                            render={({ field }) => <div className="select-input">
                            <InputLabel id="sucursal-label" error={errors.sucursal?.type === 'required'}>Sucursal</InputLabel>
                            <FormControl error={errors.sucursal?.type === 'required'} fullWidth>
                            <Select fullWidth
                                    error={errors.sucursal?.type === 'required'}
                                    labelId="sucursal-label"
                                    id="sucursal"
                                    {... field}
                                    inputProps={{ readOnly: !isNew }}
                                    label="Sucursal" >
                                <MenuItem key={-1} value=""><em>Vacío</em></MenuItem>
                                {sucursals.map((sucursal, index) =>
                                    <MenuItem key={index} value={sucursal.name}>{sucursal.name}</MenuItem>
                                )}
                            </Select>
                            {errors.sucursal && <FormHelperText>Campo obligatorio.</FormHelperText>}
                            </FormControl >
                            </div>}
                            rules={{ required: true }}
                        />
                        <Controller
                            name="rol"
                            control={control}
                            render={({ field }) => <div className="select-input">
                            <InputLabel id="rol-label" error={errors.sucursal?.type === 'required'}>Rol</InputLabel>
                            <FormControl error={errors.rol?.type === 'required'} fullWidth>
                            <Select fullWidth
                                    error={errors.rol?.type === 'required'}
                                    labelId="rol-label"
                                    id="rol"
                                    {... field}
                                    label="Rol"  >
                                <MenuItem key={-1} value=""><em>Vacío</em></MenuItem>
                                {roles.map((rol, index) =>
                                    <MenuItem key={index} value={rol.name}>{rol.name}</MenuItem>
                                )}
                            </Select>
                            {errors.rol && <FormHelperText>Campo obligatorio.</FormHelperText>}
                            </FormControl >
                            </div>}
                            rules={{ required: true }}
                        />
                        {isNew && <Controller
                            name="password"
                            control={control}
                            render={({ field }) => <TextField 
                                                        error={errors.password?.type === 'required'}
                                                        helperText={errors.password ? 'Campo obligatorio.' : ''}
                                                        id="password" label="Contraseña" type="password" margin="dense" variant="standard" fullWidth {...field}/> }
                            rules={{ required: true }}
                        />}
                        
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button type="submit" >Guardar</Button>
                </DialogActions>
                </form>
            </Dialog>

            <Confirm 
                open={openConfirm}
                title={'Eliminar usuarios'} 
                message={'¿Desea realmente realizar la eliminación?'} 
                handleClose={handleCloseConfirm}
                handleAccept={handleAcceptConfirm}
                 />
        </div>
        <FilterMenu 
            open={open_menu} 
            anchorEl={anchorEl} 
            handleClose={closeMenu} 
            
            columns={columns} 
            filters={filters}
            add={addFilter}
            remove={removeFilter}
            handlerSelectColumn={handlerChangeSelectColumn}
            handlerSelectOperator={handlerChangeSelectOperator}
            handlerValue={handlerChangeValue}
            handlerSelectLogicOperator={handlerChangeSelectLogicOperator}/>
    </>);
}

export default Users;