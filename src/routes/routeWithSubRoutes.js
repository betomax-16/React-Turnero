import { Route } from 'react-router-dom';

//pasar socket
const RouteWithSubRoutes = (route) => {
    return (
    <Route
        path={route.path}
        render={(props) => {
            const auxProps = {...props, ...route.props};
            return <route.component {...auxProps} routes={route.routes} />;
        }}
    />
    );
};

export default RouteWithSubRoutes;