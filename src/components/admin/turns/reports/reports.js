import { useState, useContext } from "react";
import { useForm, Controller  } from "react-hook-form";
import { DataGrid, GridToolbarContainer, GridToolbarExport, esES } from '@mui/x-data-grid';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import DateAdapter from '@mui/lab/AdapterMoment'
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DatePicker from '@mui/lab/DatePicker';
import CircularProgress from '@mui/material/CircularProgress';
import AppContext from "../../../../context/app/app-context";
import moment from "moment";
import axios from "axios";
import './styles.css';

const columnsGeneral = [
    { field: 'sucursal', headerName: 'Sucursal', flex: 1 },
    { field: 'area', headerName: 'Area', flex: 1 },
    { field: 'shiftsCreated', headerName: 'Turnos creados', flex: 1 },
    { field: 'canceledShifts', headerName: 'Turnos cancelados', flex: 1 },
    { field: 'shiftsFinished', headerName: 'Turnos atendidos', flex: 1 },
    { field: 'averageWaitTime', headerName: 'Promedio tiempo de espera', flex: 1 },
    { field: 'averageAttentionTime', headerName: 'Promedio tiempo de atención', flex: 1 },
    { field: 'averageServiceTime', headerName: 'Promedio tiempo de servicio', flex: 1 },
    { field: 'maxWaitTime', headerName: 'Tiempo máximo de espera', flex: 1 },
    { field: 'maxWaitAttentionTime', headerName: 'Tiempo máximo de atención', flex: 1 }
];

const columnsGeneralByHour = [
    { field: 'time', headerName: 'Hora', flex: 1 },
    { field: 'sucursal', headerName: 'Sucursal', flex: 1 },
    { field: 'area', headerName: 'Area', flex: 1 },
    { field: 'shiftsCreated', headerName: 'Turnos creados', flex: 1 },
    { field: 'canceledShifts', headerName: 'Turnos cancelados', flex: 1 },
    { field: 'shiftsFinished', headerName: 'Turnos atendidos', flex: 1 },
    { field: 'averageWaitTime', headerName: 'Promedio tiempo de espera', flex: 1 },
    { field: 'averageAttentionTime', headerName: 'Promedio tiempo de atención', flex: 1 },
    { field: 'averageServiceTime', headerName: 'Promedio tiempo de servicio', flex: 1 },
    { field: 'maxWaitTime', headerName: 'Tiempo máximo de espera', flex: 1 },
    { field: 'maxWaitAttentionTime', headerName: 'Tiempo máximo de atención', flex: 1 }
];

const columnsDetail = [
    { field: 'sucursal', headerName: 'Sucursal', flex: 1 },
    { field: 'turn', headerName: 'Turno', flex: 1 },
    { field: 'area', headerName: 'Area', flex: 1 },
    { field: 'date', headerName: 'Fecha', flex: 1 },
    { field: 'module', headerName: 'Puesto', flex: 1 },
    { field: 'user', headerName: 'Usuario', flex: 1 },
    { field: 'beginningTime', headerName: 'Hora de emisión', flex: 1 },
    { field: 'callingTime', headerName: 'Hora de llamado', flex: 1 },
    { field: 'endingTime', headerName: 'Hora final de atención', flex: 1 },
    { field: 'waitTime', headerName: 'Tiempo de espera', flex: 1 },
    { field: 'attentionTime', headerName: 'Tiempo de atención', flex: 1 }
];

function CustomToolbar() {
    return (
        <GridToolbarContainer>
            <GridToolbarExport csvOptions={{ utf8WithBom: true } }/>
        </GridToolbarContainer>
    );
}

function Reports(props) {
    const { showAlert } = useContext(AppContext);
    const { control, handleSubmit, formState: { errors } } = useForm({defaultValues: {
        startDate: moment().set("date",1),
        finalDate: moment().set("date",1).add(1, 'month'),
        sucursal: '',
        area: ''
    }});
    const onSubmit = data => getData(data);

    const [data, setData] = useState([]);
    const [dataAux, setDataAux] = useState({
        general: [],
        generalIntervalTime: [],
        detail: []
    });

    const [showLoading, setShowLoading] = useState(false);
    const [columns, setColumns] = useState(columnsGeneral);
    const [selectOptionReport, setSelectOptionReport] = useState('General');

    const handleChange = (event) => {
        const option = event.target.value;
        setSelectOptionReport(option);

        if (option === 'General') {
            setColumns(columnsGeneral);
            setData(dataAux.general);
        }
        else if (option === 'GeneralByHour') {
            setColumns(columnsGeneralByHour);
            setData(dataAux.generalIntervalTime);
        }
        else if (option === 'Detail') {
            setColumns(columnsDetail);
            setData(dataAux.detail);
        }
    };

    const getData = async (data) => {
        try {
            if (moment(data.starDate).isValid() && moment(data.finalDate).isValid()) {
                setShowLoading(true);
                const startDate = moment(data.startDate);
                const finalDate = moment(data.finalDate);
                const req = {
                    startDate: startDate.format('YYYY-MM-DD'),
                    finalDate: finalDate.format('YYYY-MM-DD'),
                    sucursal: data.sucursal,
                    area: data.area
                };

                let url = '';
                let op = '';
                if (selectOptionReport === 'General') {
                    url = `http://${window.location.hostname}:4001/api/reports/general?startDate=${req.startDate}&finalDate=${req.finalDate}`;
                    op = 'general';
                }
                else if (selectOptionReport === 'GeneralByHour') {
                    url = `http://${window.location.hostname}:4001/api/reports/generalByHour?startDate=${req.startDate}&finalDate=${req.finalDate}`;
                    op = 'generalIntervalTime';
                }
                else if (selectOptionReport === 'Detail') {
                    url = `http://${window.location.hostname}:4001/api/reports/detail?startDate=${req.startDate}&finalDate=${req.finalDate}`;
                    op = 'detail';
                }

                if (req.sucursal && req.sucursal !== '') {
                    url += `&sucursal=${req.sucursal}`;
                }

                if (req.area && req.area !== '') {
                    url += `&area=${req.area}`;
                }

                if (url !== '') {
                    const res = await axios.get(url, { 
                        headers: {
                            'auth': localStorage.getItem('token')
                        }
                    });

                    const rows = [];
                    if (res.data.body.length) {
                        for (let index = 0; index < res.data.body.length; index++) {
                            const row = res.data.body[index];
                            rows.push({
                                id: index,
                                ...row
                            });
                        }
                    }

                    const copyDataAux = {...dataAux};
                    copyDataAux[op] = rows;

                    setDataAux(copyDataAux);
                    setData(rows);
                    setShowLoading(false);
                }
            }
        } catch (error) {
            console.log(error);
            setShowLoading(false);
            showAlert("red", 'algo salio mal');
        }
    }

    return (<>
        <div className="reports-container">
            <h1>Reportes</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="content">
                <div className="select-input">
                    <InputLabel id="rol-label">Tipo</InputLabel>
                    <FormControl style={{width:200}}>
                        <Select fullWidth
                                labelId="type-label"
                                value={selectOptionReport}
                                onChange={handleChange}
                                id="type"
                                label="Tipo"  >
                            <MenuItem key={0} value="General"><em>General</em></MenuItem>
                            <MenuItem key={1} value="GeneralByHour"><em>Por cada 30 min.</em></MenuItem>
                            <MenuItem key={2} value="Detail"><em>Detallado</em></MenuItem>
                        </Select>
                    </FormControl >
                </div>
                <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => <div className="select-input">
                    <InputLabel id="startDate-label" error={errors.startDate?.type === 'required'}>Desde</InputLabel>
                    <FormControl error={errors.startDate?.type === 'required'} fullWidth>
                    <LocalizationProvider dateAdapter={DateAdapter}>
                        <DatePicker
                            error={errors.startDate?.type === 'required'}
                            renderInput={(props) => <TextField {...props} />}
                            labelId="startDate-label"
                            value={props.value}
                            {... field}
                        />
                    </LocalizationProvider>
                    {errors.startDate && <FormHelperText>Campo obligatorio.</FormHelperText>}
                    </FormControl >
                    </div>}
                    rules={{ required: true }}
                />
                <Controller
                    name="finalDate"
                    control={control}
                    render={({ field }) => <div className="select-input">
                    <InputLabel id="finalDate-label" error={errors.finalDate?.type === 'required'}>Hasta</InputLabel>
                    <FormControl error={errors.finalDate?.type === 'required'} fullWidth>
                    <LocalizationProvider dateAdapter={DateAdapter}>
                        <DatePicker
                            error={errors.finalDate?.type === 'required'}
                            renderInput={(props) => <TextField {...props} />}
                            labelId="finalDate-label"
                            value={props.value}
                            {... field}
                        />
                    </LocalizationProvider>
                    {errors.finalDate && <FormHelperText>Campo obligatorio.</FormHelperText>}
                    </FormControl >
                    </div>}
                    rules={{ required: true }}
                />
                <Controller
                    name="sucursal"
                    control={control}
                    render={({ field }) => <TextField className="field" id="sucursal" label="Sucursal" type="text" margin="dense" variant="outlined"  {...field}/> }
                />
                <Controller
                    name="area"
                    control={control}
                    render={({ field }) => <TextField className="field" id="area" label="Area" type="text" margin="dense" variant="outlined"  {...field}/> }
                />
                <Button type="submit" variant="contained" className="button">Consultar</Button>
            </form>
            <div className="table">
                {!showLoading ? 
                    <DataGrid
                        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                        rows={data}
                        columns={columns}
                        pageSize={30}
                        rowsPerPageOptions={[30]}
                        disableSelectionOnClick
                        components={{
                            Toolbar: CustomToolbar,
                        }}
                    /> :
                    <CircularProgress size={100}/>
                }
            </div>
        </div>
    </>);
}

export default Reports;