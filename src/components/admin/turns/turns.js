import { Switch, Redirect } from "react-router-dom";
import RouteWithSubRoutes from "../../../routes/routeWithSubRoutes";
import './styles.css';

function Turns({ routes }) {
    return (
        <div className="turns-container">
            <Switch>
                <Redirect exact from='/admin/turnos' to='/admin/turnos/actuales' />
                {routes.map((route, i) => (
                    <RouteWithSubRoutes key={i} {...route} />
                ))}
            </Switch>
        </div>
    );
}

export default Turns;