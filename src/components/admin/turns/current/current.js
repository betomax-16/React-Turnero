import { useState, useEffect, useContext } from "react";
import { DataGrid, esES } from '@mui/x-data-grid';
import axios from "axios";
import moment from "moment";
import Tooltip from '@mui/material/Tooltip';
import AppContext from "../../../../context/app/app-context";
import FilterMenu from "../../../utils/filter/filter";
import { FaFilter } from "react-icons/fa";
import { getOperatorMongo } from "../../../../utils/operatorsMongoQuery";
import './styles.css';

const columnsTurns = [
    { field: 'turn', headerName: 'Turno', flex: 1, mytype: 'string' },
    { field: 'area', headerName: 'Area', flex: 1, mytype: 'string' },
    { field: 'sucursal', headerName: 'Sucursal', flex: 1, mytype: 'string' },
    { field: 'state', headerName: 'Estado', flex: 1, mytype: 'string' },
    { field: 'creationDate', headerName: 'Fecha creación', flex: 1, mytype: 'date' }
];

const columnsTrace = [
    { field: 'turn', headerName: 'Turno', flex: 1, mytype: 'string' },
    { field: 'sucursal', headerName: 'Sucursal', flex: 1, mytype: 'string' },
    { field: 'state', headerName: 'Estado', flex: 1, mytype: 'string' },
    { field: 'username', headerName: 'Atendido por', flex: 1, mytype: 'string' },
    { field: 'startDate', headerName: 'Fecha inicio', flex: 1, mytype: 'date' },
    { field: 'finalDate', headerName: 'Fecha fin', flex: 1, mytype: 'date' },
];

function Current(props) {
    const urlTurns = `http://localhost:4000/api/shifts`;
    const urlTrace = `http://localhost:4000/api/trace`;
    const { showAlert, reset } = useContext(AppContext);
    const [tab, setTab] = useState(0);
    const [turns, setTurns] = useState([]);
    const [trace, setTrace] = useState([]);

    const handlerChangeTab = (index) => {
        setTab(index);

        const auxFilters = [...filters];
        if (index === 0) {
            setFiltersTrace(auxFilters);
            const auxFilterTurns = [...filtersTurns];
            setFilters(auxFilterTurns);
            setColumns(columnsTurns);
        }

        if (index === 1) {
            setFiltersTurns(auxFilters);
            const auxFilterTrace = [...filtersTrace];
            setFilters(auxFilterTrace);
            setColumns(columnsTrace);
        }
    }

    useEffect(() => {
        getTurns();
        getTrace();
        setColumns(columnsTurns);
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        getTurns();
        getTrace();
    }, [reset]);// eslint-disable-line react-hooks/exhaustive-deps

    const getTurns = async (url = '') => {
        try {
            const urlApi = url !== '' ? url : urlTurns;
            const res = await axios.get(urlApi, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            const rows = [];
            res.data.body.forEach(row => {
                rows.push({
                    id: row._id,
                    turn: row.turn,
                    area: row.area,
                    creationDate: moment(row.creationDate).format("YYYY-MM-DD HH:mm:ss"),
                    state: row.state,
                    sucursal: row.sucursal
                });
            });

            setTurns(rows);
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

    const getTrace = async (url = '') => {
        try {
            const urlApi = url !== '' ? url : urlTrace;
            const res = await axios.get(urlApi, { 
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });

            const rows = [];
            res.data.body.forEach(row => {
                let finalDate = undefined;
                if (row.finalDate) {
                    finalDate = moment(row.finalDate).format("YYYY-MM-DD HH:mm:ss"); 
                }
                rows.push({
                    id: row._id,
                    turn: row.turn,
                    sucursal: row.sucursal,
                    state: row.state,
                    username: row.username,
                    startDate: moment(row.startDate).format("YYYY-MM-DD HH:mm:ss"),
                    finalDate: finalDate
                });
            });

            setTrace(rows);
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
    const open = Boolean(anchorEl);
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
            type: columnsTurns[0].mytype,
            field: columnsTurns[0].field,
            operator: '%',
            value: ''
        }
    ]);

    const [columns, setColumns] = useState(columnsTurns);
    const [filtersTurns, setFiltersTurns] = useState([
        {
            index: indexFilter,
            type: columnsTurns[0].mytype,
            field: columnsTurns[0].field,
            operator: '%',
            value: ''
        }
    ]);
    const [filtersTrace, setFiltersTrace] = useState([
        {
            index: indexFilter,
            type: columnsTrace[0].mytype,
            field: columnsTrace[0].field,
            operator: '%',
            value: ''
        }
    ]);

    useEffect(() => {
        console.log(filters);
        let query = '?';
        filters.forEach(filter => {
            const op = getOperatorMongo(filter.operator);
            const logicOp = filter.logicOperator !== undefined ? `|${filter.logicOperator}` : '';
            let val = filter.value;
            if (typeof val === 'object') {
                const m = moment(filter.value);
                if (m.isValid()) {
                    val = m.format('YYYY-MM-DD HH:mm');
                }
            }
            
            query += `${filter.field}=${val}|${op}${logicOp}&`
        });
        query = query.substring(0, query.length - 1);

        let auxUrlUsers = tab === 0 ? urlTurns : urlTrace;
        auxUrlUsers += query;

        console.log(auxUrlUsers);
        if (tab === 0) {
            getTurns(auxUrlUsers);
        }
        else {
            getTrace(auxUrlUsers);
        }
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

        if (columns[0].mytype === 'date') {
            filter.value = new Date();
        }

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
            const auxCol = columns.find(col => col.field === event.target.value);
            if (auxCol.mytype === 'date') {
                auxData[editIndex].value = new Date();
            }
            else {
                auxData[editIndex].value = '';
            }

            auxData[editIndex].operator = '=';
            auxData[editIndex].type = auxCol.mytype;
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
            if (event.target) {
                auxData[editIndex].value = event.target.value;
            }
            else {
                auxData[editIndex].value = event;
            }
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
        <div className="current-container">
            <h1>Turnos Actuales</h1>
            <div className="tab-container">
                <Tooltip title="Filtros">
                    <div onClick={openMenu} className="button-filter">
                        <FaFilter className="icon"/>
                    </div>
                </Tooltip>
                <div className="tab-buttons">
                    <div className={tab === 0 ? 'tab select' : 'tab'} onClick={()=>handlerChangeTab(0)}>En proceso</div>
                    <div className={tab === 1 ? 'tab select' : 'tab'} onClick={()=>handlerChangeTab(1)}>Trazas</div>
                </div>
                <div className="tab-body">
                    {tab === 0 ? <div className="page">
                        <DataGrid
                            localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                            rows={turns}
                            columns={columnsTurns}
                            pageSize={10}
                            disableColumnMenu={true}
                            rowsPerPageOptions={[10]}
                            disableSelectionOnClick
                            onSelectionModelChange={(ids) => {
                                console.log(ids[0]);
                            }}
                        />
                    </div> :
                    <div className="page">
                    <DataGrid
                        localeText={esES.components.MuiDataGrid.defaultProps.localeText}
                        rows={trace}
                        columns={columnsTrace}
                        pageSize={10}
                        disableColumnMenu={true}
                        rowsPerPageOptions={[10]}
                        disableSelectionOnClick
                        onSelectionModelChange={(ids) => {
                            console.log(ids[0]);
                        }}
                    />
                </div>}
                </div>
            </div>
        </div>
        <FilterMenu 
            open={open} 
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

export default Current;