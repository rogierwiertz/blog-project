exports.get403 = (req, res) => {
    res.render('403.ejs', {
        title: '403 Access Denied',
        path: '',
    });
}

exports.get404 = (req, res) => {
    res.render('404.ejs', {
        title: '404 Page Not Found',
        path: '',
    });
}