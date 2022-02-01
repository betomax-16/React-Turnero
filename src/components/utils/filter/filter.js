import Menu from '@mui/material/Menu';
import ItemFilter from "./item/item-filter";
import { BsPlusCircleDotted } from "react-icons/bs";

import './styles.css';

function FilterMenu(props) {
    return (
        <Menu
        anchorEl={props.anchorEl}
        open={props.open}
        onClose={props.handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
            <div className="item-filter-header">
                <BsPlusCircleDotted onClick={props.add} size={25} className='button-plus'/>
                <span className='headerField'>Operación</span>
                <span className='headerField'>Campo</span>
                <span className='headerField'>Comparación</span>
                <span className='headerField'>Valor</span>
            </div>
            <div className='list-filters'>
                {props.filters.map((filter, index) => <ItemFilter 
                                                key={index}
                                                logicOperator={filter.logicOperator}
                                                columns={props.columns} 
                                                type={filter.type}
                                                field={filter.field} 
                                                operator={filter.operator} 
                                                value={filter.value} 
                                                index={filter.index}
                                                remove={props.remove}
                                                handlerSelectLogicOperator={props.handlerSelectLogicOperator}
                                                handlerSelectColumn={props.handlerSelectColumn}
                                                handlerSelectOperator={props.handlerSelectOperator}
                                                handlerValue={props.handlerValue}/>)}
            </div>
      </Menu>
    );
}

export default FilterMenu;