import Login from "../components/login/login";
import TakeTurn from "../components/takeTurn/takeTurn";
import Screen from "../components/screen/screen";
import AttendTurn from "../components/attendTurn/attendTurn";
import LookOut from "../components/lookOut/lookOut";
import AttendTest from "../components/attendTest/attendTest";
import Admin from "../components/admin/admin";
import Sucursales from "../components/admin/sucursales/sucursales";
import Users from "../components/admin/users/users";
import Areas from "../components/admin/areas/areas";
import Modules from "../components/admin/modules/modules";
import Turns from "../components/admin/turns/turns";
import Current from "../components/admin/turns/current/current";
import History from "../components/admin/turns/history/history";
import Reports from "../components/admin/turns/reports/reports";
import Config from "../components/admin/config/config";

const routes = [
    {
        path: '/login',
        component: Login,
    },
    {
        path: '/toma-turno/:suc',
        component: TakeTurn,
    },
    {
        path: '/pantalla/:suc',
        props: {showAdds: true},
        component: Screen,
    },
    {
        path: '/atencion',
        component: AttendTurn,
    },
    {
        path: '/vigia',
        component: LookOut,
    },
    {
        path: '/toma/:suc/:module',
        component: AttendTest,
    },
    {
        path: '/admin',
        component: Admin,
        routes: [    
            {
                path: '/admin/sucursales',
                component: Sucursales,
            },          
            {
                path: '/admin/usuarios',
                component: Users,
            },
            {
                path: '/admin/areas',
                component: Areas,
            },
            {
                path: '/admin/modulos',
                component: Modules,
            },
            {
                path: '/admin/configurations',
                component: Config,
            },
            {
                path: '/admin/turnos',
                component: Turns,
                routes: [
                    {
                        path: '/admin/turnos/actuales',
                        component: Current,
                    },
                    {
                        path: '/admin/turnos/historicos',
                        component: History,
                    },
                    {
                        path: '/admin/turnos/reportes',
                        component: Reports,
                    }
                ]
            },
        ],
    },
];

export default routes;