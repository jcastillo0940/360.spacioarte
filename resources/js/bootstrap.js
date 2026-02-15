import axios from 'axios';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

window.route = function(name, params = {}) {
    const routes = window.routes || {};
    
    if (!routes[name]) {
        console.warn(`Route ${name} not found`);
        return `/${name}`;
    }
    
    let url = routes[name];
    
    Object.keys(params).forEach(key => {
        url = url.replace(`{${key}}`, params[key]);
    });
    
    return '/' + url.replace(/^\/+/, '');
};