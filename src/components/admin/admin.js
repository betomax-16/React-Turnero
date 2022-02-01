import { Switch } from "react-router-dom";
import RouteWithSubRoutes from "../../routes/routeWithSubRoutes";
import Menu from "./menu/menu";
import RequireAuth from "../../components/utils/auth/RequireAuth";
import './styles.css';

function Admin({ routes }) {
    return (
        <RequireAuth>
            <div className="admin-container">
                <div className="left">
                    <Menu/>
                </div>
                <div className="right">
                    <Switch>
                        {routes.map((route, i) => (
                            <RouteWithSubRoutes key={i} {...route} />
                        ))}
                    </Switch>
                </div>
            </div>
        </RequireAuth>
    );
}

export default Admin;