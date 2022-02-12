import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import './styles.css';

const HtmlTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} followCursor/>
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9',
  },
}));

function ModuleCard(props) {

  const getStatusColor = () => {
    let color = 'disabled';
    switch (props.data.status) {
      case 'Libre':
        color = 'disabled';
        break;
      case 'Activo':
        color = 'active';
        break;
      case 'Inactivo':
        color = 'inactive';
        break;
      default:
        break;
    }

    return color;
  }

  const getFullNameUser = () => {
    let fullName = props.data.username;
    if (props.data && props.data.user && props.data.user.name) {
      fullName = `${props.data.user.name} ${props.data.user.firstLastName} ${props.data.user.secondLastName}`;
    }

    return fullName;
  }

  const getPrivilages = () => {
    const items = [];
    if (props.data.mode === 'auto') {
      let message = 'No';
      if (props.data.isPrivilegeByArrivalTime) {
        message = 'Si';
      }

      items.push(<li key={0}>Por tiempo de espera - ({message})</li>);
      if (props.data.privilages.length) {
        const auxPrivileges = props.data.privilages.sort(( a, b ) => {
          if ( a.privilege < b.privilege ){
            return -1;
          }
          if ( a.privilege > b.privilege ){
            return 1;
          }
          return 0;
        });
        auxPrivileges.forEach((element, index) => {
          items.push(<li key={index + 1}>{element.area} - {element.privilege}</li>);
        });
      }
      else {
        items.push(<li key={1}>Sin Privilegios.</li>);
      }  
    }
    
    return items;
  }

  return (<>
    <HtmlTooltip
      title={<>
          <h2>Datos y configuración</h2>
          <h3>Usuario:</h3><em>{getFullNameUser()}</em>
          <h3>Modo:</h3><em>{props.data.mode.toUpperCase()}</em>
          {props.data.mode === 'auto' && <><h3>Privilegios:</h3><ul>{getPrivilages()}</ul></>}
      </>}
    >
      <div data-tip="Hola" data-for="global" className="module-card-container">
        <div className={getStatusColor()}>
          <div className="card-body">
            <span>{props.data.number}</span>          
          </div>
          <div className="card-footer">
            <span className="title">Módulo</span>
            {props.data.username !== undefined && props.data.username !== '' &&
            <span className="tag">Usuario: <span className="important">{props.data.username}</span></span>}
            <span className="tag">Estado: <span className="important">{props.data.status}</span></span>
          </div>
        </div>
      </div>
    </HtmlTooltip>
  </>);
}

export default ModuleCard;