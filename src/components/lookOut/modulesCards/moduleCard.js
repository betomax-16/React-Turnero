import './styles.css';

function ModuleCard(props) {
  const getStatusColor = () => {
    let color = 'disabled';
    switch (props.status) {
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

  return (
    <div className="module-card-container">
      <div className={getStatusColor()}>
        <div className="card-body">
          <span>{props.number}</span>
        </div>
        <div className="card-footer">
          <span className="title">Módulo</span>
          {props.username !== undefined && props.username !== '' &&
          <span className="tag">Usuario: <span className="important">{props.username}</span></span>}
          <span className="tag">Estado: <span className="important">{props.status}</span></span>
        </div>
      </div>
    </div>
  );
}

export default ModuleCard;