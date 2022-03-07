import { Switch } from "react-router-dom";
import RouteWithSubRoutes from "../../routes/routeWithSubRoutes";
import socketIOClient from "socket.io-client";
import Menu from "./menu/menu";
import RequireAuth from "../../components/utils/auth/RequireAuth";
import './styles.css';
import { useEffect, useState } from "react";

function Admin({ routes }) {
    const ENDPOINT = `http://${window.location.hostname}:4000`;
    const [ socket, setSocket ] = useState(null);

    useEffect(() => {
        const auxSocket = socketIOClient(ENDPOINT);
        setSocket(auxSocket);
    }, []);// eslint-disable-line react-hooks/exhaustive-deps

    return (
        <RequireAuth>
            <div className="admin-container">
                <div className="left">
                    <Menu/>
                </div>
                <div className="right">
                    <Switch>
                        {routes.map((route, i) => {
                            const props = {...route.props, socket: socket};
                            route.props = props;
                            return <RouteWithSubRoutes key={i} {...route} />
                        })}
                    </Switch>
                </div>
            </div>
        </RequireAuth>
    );
}

export default Admin;