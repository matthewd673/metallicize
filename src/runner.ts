const runQuery = (url:string) => {
    fetch(url)
        .then((response) => {
            console.log(response);
            return response.json();
        })
        .then((data) => {
            console.log(data);
        });
}

export { runQuery };