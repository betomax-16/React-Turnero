import { useState, useContext, useEffect } from "react";
import { useForm, Controller  } from "react-hook-form";
import axios from "axios";
import { Link } from "react-router-dom";
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
import InputNumber from "../../utils/inputNumber/inputNumber";
import ItemSupervisor from "./itemSupervisor/itemSupervisor";
import { DataGrid, esES } from '@mui/x-data-grid';
import { MdModeEdit } from "react-icons/md";
import { AiFillDelete } from "react-icons/ai";
import { BsPlusLg } from "react-icons/bs";
import { FaFilter, FaUserCheck, FaUserTimes } from "react-icons/fa";
import { getOperatorMongo } from "../../../utils/operatorsMongoQuery";
import './styles.css';

// const protocol = window.location.protocol;
// const host = window.location.host;

function Modules(props) {
    const urlModules = `http://localhost:4000/api/modules`;
    const [openConfirm, setOpenConfirm] = useState({
        state: false,
        title: '',
        ask: ''
    });

    const handleAcceptConfirm = () => {
        try {
            if (openConfirm.title === 'Eliminar modulos') {
                if (modulesSelected.length > 0) {
                    modulesSelected.forEach(async item => {
                        await axios.delete(`http://localhost:4000/api/modules/${item.name}/${item.sucursal}`, { 
                            headers: {
                                'auth': localStorage.getItem('token')
                            }
                        });
                    });
    
                    showAlert("green", 'Eliminación exitosa.'); 
                    getModules();
                    setOpenConfirm({
                        state: false,
                        title: '',
                        ask: ''
                    });
                }
            }
            else if (openConfirm.title === 'Supervisores') {
                saveSupervisors();
                setOpenSupervisor(false)
            }
        } catch (error) {
            console.log(error);
            showAlert("red", 'algo salio mal');
        }
        setOpenConfirm({
            state: false,
            title: '',
            ask: ''
        });
    };

    const handlerOpenConfirm = (title, ask) => {
        setOpenConfirm({
            state: true,
            title: title,
            ask: ask
        });
    }

    const handleCloseConfirm = () => {
        setOpenConfirm({
            state: false,
            title: '',
            ask: ''
        });
    };

    const { control, handleSubmit, setValue, formState: { errors } } = useForm({defaultValues: {
        username: '',
        name: '',
        type: '',
        status: '',
        pattern: null,
        sucursal: '',
        mode: 'auto',
        associate: ''
    }});

    const [sucursals, setSucursals] = useState([]);
    const [typeSelected, setTypeSelected] = useState('');
    const onChangeType = (e) => {
        const val = e.target.value;
        setTypeSelected(val);

        if (val.toLowerCase() === 'modulo' && sucursalSelected !== '') {
            getVigias(sucursalSelected, 'vigia');   
        }
        else {
            setVigias([]);
        }
    }

    const [vigias, setVigias] = useState([]);
    const [sucursalSelected, setSucursalSelected] = useState('');
    const [moduleToMonitor, setModuleToMonitor] = useState(null);
    const [itemsSupervisors, setItemsSupervisors] = useState([]);
    const onChangeSucursal = async (val) => {
        setSucursalSelected(val);

        if (typeSelected.toLowerCase() === 'modulo' && val !== '') {
            await getVigias(val, 'vigia');   
        }
        else {
            setVigias([]);
        }
    }


    const [modules, setModules] = useState([]);
    const [modulesSelected, setModulesSelected] = useState([]);

    useEffect(() => {
        getSucursals();
        getModules();
    }, []);// eslint-disable-line react-hooks/exhaustive-deps


    


    const { showAlert } = useContext(AppContext);
    const [open, setOpen] = useState(false);
    const [openAssociate, setOpenAssociate] = useState(false);
    const [openSupervisor, setOpenSupervisor] = useState(false);
    const [isNew, setisNew] = useState(true);
    const [areas, setAreas] = useState([]);
    const [titleAssociate, setTitleAssociate] = useState('');
    
    const onSubmit = data => callSaveData(data);

    const handleClickOpen = async (val) => {
        setisNew(val);
        if (modulesSelected.length === 1 && !val) {
            const item = modulesSelected[0];
            for (const property in item) {
                setValue(property, item[property], {
                    shouldValidate: true,
                })
            }

            setTypeSelected(item.type);
            if (item.type === 'modulo') {
                await getVigias(item.sucursal, 'vigia');  
            }
            else {
                setVigias([]);
            }
        }
        else {
            if (modules.length > 0) {
                const item = modules[0];
                
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
        setTypeSelected('');
        setOpen(false);
    };

    const handleCloseSupervisor = () => {
        setModuleToMonitor(null);
        setOpenSupervisor(false);
    };

    const handleOpenAssociate = (data) => {
        setTitleAssociate(`${data.name} - ${data.sucursal}`);
        getAreasBySucursal(data.id, data.sucursal);
        setOpenAssociate(true);
    }

    const handleCloseAssociate = () => {
        setOpenAssociate(false);
    }

    const handleChangeAssociate = (index, value) => {
        const auxData = [...areas];
        const data = auxData.find(e => e.index === index);
        if (data) {
            data.privilege = value;
        }

        setAreas(auxData);
    }

    const handleSaveAssociate = () => {
        try {
            areas.forEach(element => {
                if (!element.idAssociate) {
                    axios.post(`http://localhost:4000/api/privilege`, element, { 
                        headers: {
                            'auth': localStorage.getItem('token')
                        }
                    });
                }
                else {
                    axios.put(`http://localhost:4000/api/privilege/${element.idAssociate}`, element, { 
                        headers: {
                            'auth': localStorage.getItem('token')
                        }
                    });
                } 
            });
            showAlert("green", 'Registro existoso.');
        } catch (error) {
            console.log(error);
            showAlert("red", 'Algo salio mal');
        }
    }

    const printButtonAssociate = (val) => {
        if (val) {
            if (val.type === 'modulo') {
                return  <div className="button-associate-privilege" onClick={async () => {
                    const module = modules.find(m => m.id === val.val);
                    handleOpenAssociate(module);
                }}>Asignar Privilegios</div> 
            }
            else if (val.type === 'toma') {
                return  <Link className="button-associate-privilege" to={`/toma/${val.val}`} target={'_blank'}>Abrir Módulo</Link> 
            }
        }
        else {
            return <></>
        }
    }

    const columns = [
        { field: 'name', headerName: 'Modulo', flex: 1, mytype: 'string' }, 
        { field: 'type', headerName: 'Tipo', flex: 1, mytype: 'string' },
        { field: 'status', headerName: 'Estado', flex: 1, mytype: 'bool',
            renderCell: (params) => (
                params.value === null ? <></> :
                params.value ? 
                <FaUserCheck className="icon-green" size={20}/> : 
                <FaUserTimes className="icon-red" size={20}/>
          ), },
        { field: 'sucursal', headerName: 'Sucursal', flex: 1, mytype: 'string' },
        { field: 'username', headerName: 'Atendiendo', flex: 1, mytype: 'string' },
        { field: 'pattern', headerName: 'Supervisado por', flex: 1, 
            renderCell: (params) => (
                params.value === null ? <></> :
                params.value.type !== 'modulo' ? <></> :
                <div className="button-associate-privilege" onClick={() => handlerOpenModalSupervisor(params.value)}>Asignar</div>
        ) },
        { field: 'mode', headerName: 'Modalidad', flex: 1, mytype: 'string' },
        { field: 'associate', headerName: 'Acciones', flex: 1,
            renderCell: (params) => (printButtonAssociate(params.value)),},
    ];

    const getSupervisors = async (idModule) => {
        const res = await axios.get(`http://localhost:4000/api/supervisors/${idModule}`, { 
            headers: {
                'auth': localStorage.getItem('token')
            }
        });

        return res.data.body;
    }

    const handlerOpenModalSupervisor = async (data) => {
        try {
            setModuleToMonitor(data);
            const auxVigias = await getVigias(data.sucursal, 'vigia');
            const resSupervisors = await getSupervisors(data.id);
            
            const auxItems = [];
            if (resSupervisors) {
                resSupervisors.forEach(item => {
                    auxItems.push({
                        id: item._id,
                        options: auxVigias,
                        selectOption: item.vigia._id
                    });
                });
            }

            setItemsSupervisors(auxItems);
            console.log(auxItems);
            setOpenSupervisor(true);    
        } catch (error) {
            console.log(error);
            showAlert("red", 'algo salio mal');
        }
    };

    const callSaveData = async (data) => {
        try {
            const auxData = {...data};
            delete auxData.username;
            delete auxData.status;
            if (auxData.mode === undefined || auxData.mode === '') {
                auxData.mode = 'auto';
            }
            
            if (isNew) {
                const res = await axios.post(`http://localhost:4000/api/modules`, auxData, { 
                    headers: {
                        'auth': localStorage.getItem('token')
                    }
                });
                if (res.data.statusCode === 201) {
                    showAlert("green", 'Registro exitoso.'); 
                    getModules();  
                    handleClose();
                }
                else {
                    showAlert("red", res.data.message);   
                }
            }
            else {
                const item = modulesSelected[0];
                const res = await axios.put(`http://localhost:4000/api/modules/${item.name}/${item.sucursal}`, auxData, { 
                    headers: {
                        'auth': localStorage.getItem('token')
                    }
                });
                if (res.data.statusCode === 200) {
                    showAlert("green", 'Edición exitosa.');  
                    getModules(); 
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
            const res = await axios.get(`http://localhost:5000/api/sucursal`);
            const auxSucursals = [];
            res.data.body.forEach(element => {
                auxSucursals.push(element);
            });
            setSucursals(auxSucursals);
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

    const getModules = async (url = '') => {
        try {
            const urlApi = url !== '' ? url : urlModules;
            const res = await axios.get(urlApi, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            const rows = [];
            res.data.body.forEach(row => {
                let mode = undefined;
                let associate = undefined;
                if (row.type === 'modulo') {
                    mode = row.mode;
                    associate = {
                        type: row.type,
                        val: row._id
                    }
                }
                else if (row.type === 'toma') {
                    associate = {
                        type: row.type,
                        val: `${window.btoa(row.sucursal)}/${window.btoa(row.name)}`
                    }
                }

                let auxStatus = null; 
                if (row.type !== 'toma') {
                    auxStatus = row.status;
                }
                
                const auxPattern = {
                    type: row.type,
                    id: row._id,
                    sucursal: row.sucursal,
                    name: row.name
                };

                rows.push({
                    id: row._id,
                    name: row.name,
                    type: row.type,
                    status: auxStatus,
                    sucursal: row.sucursal,
                    username: row.username,
                    pattern: auxPattern,
                    mode: mode,
                    associate: associate
                });
            });

            setModules(rows);
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

    const getVigias = async (sucursal, type) => {
        try {
            const res = await axios.get(`http://localhost:4000/api/modules?sucursal=${sucursal}|eq&type=${type}|eq`, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            setVigias(res.data.body);
            return res.data.body;
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

    const getAreasBySucursal = async (idModule, sucursal) => {
        try {
            const res = await axios.get(`http://localhost:4000/api/area-sucursal/${sucursal}`, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            const auxData = [];
            let index = 0;
            res.data.body.forEach(element => {
                auxData.push({
                    index: index,
                    moduleId: idModule,
                    area: element.area,
                    privilege: 0
                });

                index++;
            });

            const resPrivilege = await axios.get(`http://localhost:4000/api/privilege/${idModule}`, { 
                    headers: {
                        'auth': localStorage.getItem('token')
                    }
            });

            if (resPrivilege.data.body.length > 0) {
                auxData.forEach(element => {
                    const exist = resPrivilege.data.body.find(e => e.area === element.area);
                    if (exist) {
                        element.idAssociate = exist._id;
                        element.privilege = exist.privilege;
                    }
                });
            }

            setAreas(auxData);
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

        let auxUrlUsers = urlModules;
        auxUrlUsers += query;
        getModules(auxUrlUsers);
        console.log(auxUrlUsers);
    }, [filters]);// eslint-disable-line react-hooks/exhaustive-deps

    const addFilter = () => {
        let auxIndex = indexFilter;
        auxIndex++;
        const auxData = [ ...filters ];

        const filter = {
            index: auxIndex,
            logicOperator: 'and',
            type: columns[0].mytype,
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

    const handlerChangeItemSupervisor = (id, event) => {
        const auxItems = [...itemsSupervisors];
        for (let index = 0; index < auxItems.length; index++) {
            const item = {...auxItems[index]};
            if (item.id === id) {
                item.selectOption = event.target.value;
                auxItems[index] = item;
                setItemsSupervisors(auxItems);
                break;
            }
        }
    };

    const handlerClickDeleteItemSupervisor = (id) => {
        const auxItemsSipervisor = itemsSupervisors.filter(i => i.id !== id);
        setItemsSupervisors(auxItemsSipervisor);
    };

    const addItemSupervisor = () => {
        const auxItems = [...itemsSupervisors];
        if (vigias.length && auxItems.length < vigias.length) {
            const serial = (new Date()).getTime();
            auxItems.push({
                id: `id-${serial}`,
                options: vigias,
                selectOption: vigias[0]._id
            });
            setItemsSupervisors(auxItems);
        }
    }

    const addSupervisor = (idModule, idVigia) => {
        try {
            const data = { idVigia, idModule };
            axios.post(`http://localhost:4000/api/supervisors`, data, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });
        } catch (error) {
            console.log(error);
            showAlert("red", 'Ocurrio algun error interno.');
        }
    }

    const deleteSupervisor = (id) => {
        try {
            axios.delete(`http://localhost:4000/api/supervisors/${id}`, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });
        } catch (error) {
            console.log(error);
            showAlert("red", 'Ocurrio algun error interno.');
        }
    }

    const saveSupervisors = async () => {
        const auxItems = [...itemsSupervisors];
        for (let index = 0; index < auxItems.length; index++) {
            const item = auxItems[index];
            const resutl = itemsSupervisors.filter(i => i.selectOption === item.selectOption)
            if (resutl.length > 1) {
                showAlert("red", 'No se pueden repetir los vigias seleccionados.');
                return;
            }
        }

        const resSupervisors = await getSupervisors(moduleToMonitor.id);
        
        if (resSupervisors) {
            itemsSupervisors.forEach(element => {
                const result = resSupervisors.find(i => i.idModule === moduleToMonitor.id && i.idVigia === element.selectOption);
                // add relation
                if (!result) {
                    addSupervisor(moduleToMonitor.id, element.selectOption);
                }
            });

            resSupervisors.forEach(element => {
                const result = itemsSupervisors.find(i => i.selectOption === element.idVigia);
                //delete
                if (!result) {
                    deleteSupervisor(element._id);
                }
            });
        }
        else {
            // add relation
            itemsSupervisors.forEach(element => {
                addSupervisor(moduleToMonitor.id, element.selectOption);
            });
        }
        setModuleToMonitor(null);
        setOpenSupervisor(false);    
        showAlert("green", 'Cambios exitosos');
    }

    return (<>
        <div className="modules-container">
            <h1>Modulos</h1>
            <div className="table">
                <DataGrid
                    localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                    rows={modules}
                    columns={columns}
                    pageSize={14}
                    disableColumnMenu={true}
                    rowsPerPageOptions={[14]}
                    checkboxSelection
                    disableSelectionOnClick
                    onSelectionModelChange={(ids) => {
                        const auxData = [];
                        ids.forEach(id => {
                            const data = modules.find(item => item.id === id);
                            auxData.push(data);
                        });

                        setModulesSelected(auxData);
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
                {modulesSelected.length === 1 &&
                <Tooltip title="Editar">
                    <div className="button-edit" onClick={() => handleClickOpen(false)}>
                        <MdModeEdit className="icon"/>
                    </div>
                </Tooltip>
                }
                {modulesSelected.length >= 1 &&
                <Tooltip title="Eliminar">
                    <div className="button-delete" onClick={() => handlerOpenConfirm('Eliminar modulos', '¿Desea realmente realizar la eliminación?')}>
                        <AiFillDelete className="icon"/>
                    </div>
                </Tooltip>
                }
            </div>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{isNew ? 'Nuevo ' : 'Editar '} modulo</DialogTitle>
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
                            name="type"
                            control={control}
                            render={({ field }) => <div className="select-input">
                            <InputLabel id="type-label" error={errors.type?.type === 'required'}>Tipo</InputLabel>
                            <FormControl error={errors.type?.type === 'required'} fullWidth>
                            <Select fullWidth
                                    error={errors.type?.type === 'required'}
                                    labelId="type-label"
                                    id="type"
                                    value={field.value}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        onChangeType(e);
                                    }}
                                    label="Tipo" >
                                <MenuItem value=""><em>Vacío</em></MenuItem>
                                <MenuItem value="modulo"><em>Modulo</em></MenuItem>
                                <MenuItem value="vigia"><em>Vigia</em></MenuItem>
                                <MenuItem value="toma"><em>Toma</em></MenuItem>
                            </Select>
                            {errors.type && <FormHelperText>Campo obligatorio.</FormHelperText>}
                            </FormControl >
                            </div>}
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
                                    value={field.value}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        onChangeSucursal(e.target.value);
                                    }}
                                    // onChange={onChangeSucursal}
                                    label="Sucursal" >
                                <MenuItem key={-1} value=""><em>Vacío</em></MenuItem>
                                {sucursals.map((sucursal, index) =>
                                    <MenuItem className="item-combobox" key={index} value={sucursal.name}>{sucursal.name}</MenuItem>
                                )}
                            </Select>
                            {errors.sucursal && <FormHelperText>Campo obligatorio.</FormHelperText>}
                            </FormControl >
                            </div>}
                            rules={{ required: true }}
                        />
                        {typeSelected.toLowerCase() === 'modulo' && <>
                        {/* <Controller
                            name="pattern"
                            control={control}
                            render={({ field }) => <div className="select-input">
                            <InputLabel id="pattern-label" error={errors.pattern?.type === 'required'}>Supervisado por</InputLabel>
                            <FormControl error={errors.pattern?.type === 'required'} fullWidth>
                            <Select fullWidth
                                    error={errors.pattern?.type === 'required'}
                                    labelId="pattern-label"
                                    id="pattern"
                                    {... field}
                                    label="Supervisado por" >
                                <MenuItem value=""><em>Vacío</em></MenuItem>
                                {vigias.map((vigia, index) =>
                                    <MenuItem className="item-combobox" key={index} value={vigia.name}>{vigia.name}</MenuItem>
                                )}
                            </Select>
                            </FormControl >
                            </div>}
                            rules={{ required: true }}
                        /> */}

                        <Controller
                            name="mode"
                            control={control}
                            render={({ field }) => <div className="select-input">
                            <InputLabel id="mode-label" error={errors.mode?.type === 'required'}>Modalidad</InputLabel>
                            <FormControl error={errors.mode?.type === 'required'} fullWidth>
                            <Select fullWidth
                                    error={errors.mode?.type === 'required'}
                                    labelId="mode-label"
                                    id="mode"
                                    {... field}
                                    label="Modalidad" >
                                <MenuItem value="auto"><em>Automático</em></MenuItem>
                                <MenuItem value="manual"><em>Manual</em></MenuItem>
                            </Select>
                            </FormControl >
                            </div>}
                            rules={{ required: true }}
                        />
                        </>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button type="submit" >Guardar</Button>
                </DialogActions>
                </form>
            </Dialog>

            <Dialog open={openAssociate} onClose={handleCloseAssociate}>
                <DialogTitle>Prioridad: {titleAssociate}</DialogTitle>
                <DialogContent>
                    {areas.map(area => <InputNumber key={area.index} index={area.index} label={area.area} value={area.privilege} onChange={handleChangeAssociate}/>)}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAssociate}>Cancelar</Button>
                    <Button onClick={handleSaveAssociate}>Guardar</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openSupervisor} onClose={handleCloseSupervisor}>
                <DialogTitle style={{textAlign: 'center'}}>Supervisores</DialogTitle>
                <DialogContent>
                    {itemsSupervisors.map((item, index) => <ItemSupervisor key={index} id={item.id} data={item} handleChange={handlerChangeItemSupervisor} handlerDelete={handlerClickDeleteItemSupervisor}/>)}
                </DialogContent>
                <DialogActions>
                    <Button onClick={addItemSupervisor}>Agregar</Button>
                    <Button onClick={() => handlerOpenConfirm('Supervisores', '¿Desea realmente realizar los cambios?')}>Guardar</Button>
                </DialogActions>
            </Dialog>

            <Confirm 
                open={openConfirm.state}
                title={openConfirm.title} 
                message={openConfirm.ask} 
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

export default Modules;