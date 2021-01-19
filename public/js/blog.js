/**
 * Modal for deleting an article
 */
const deleteModalElement = document.getElementById('deleteModal');
const deleteModal = new mdb.Modal(deleteModalElement);

deleteModalElement.addEventListener('show.mdb.modal', (event) => {
    // Button that triggered the modal
    const button = event.relatedTarget
    // Extract info from data-* attributes
    const postId = button.getAttribute('data-article')
    const postTitle = button.getAttribute('data-postTitle');
    // Update the modal's content.      
    const modalPostTitle = deleteModalElement.querySelector('#modalPostTitle');
    const modalDeleteInput = deleteModalElement.querySelector('#modalDeleteInput');

    modalPostTitle.textContent = postTitle;
    modalDeleteInput.value = postId;
});

/**
 * Ajax functions 
 */
const deleteArticle = (btn) => {
    const articleId = btn.parentNode.querySelector('[name=id]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;
    const tableRow = document.getElementById(`row-${articleId}`);    
    
    fetch(`/blog/delete-article/${articleId}`, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
    .then(res => {
        return res.json();
    })
    .then(json => {
        let error = false;
        if (json.statusCode >= 400) {
            error = true;
        }
        else {
            tableRow.remove();
        }
        displayMessage(json.message, error);
    })
    .catch();
}

const publishArticle = (btn) => {
    const csrf = btn.closest('td').querySelector('[name=_csrf]').value;
    const articleId = btn.closest('td').querySelector('[name=id]').value;
    
    const body = {
        id: articleId,
        _csrf: csrf
    };
    
    fetch('/blog/publish-article', {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(res => {      
        if(res.status === 200)   {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-light');
            btn.innerHTML = '<i class="fas fa-eye-slash"></i>';

            btn.setAttribute('onclick', 'unpublishArticle(this)');
            
            const published = btn.closest('tr').querySelector(`[data-published='${articleId}']`);
            published.innerHTML = '<i class="fas fa-check text-success"></i>';
        }
        
        return res.json()
    })
    .then(json => {
        let error = false;
        if (json.statusCode >= 400) {
            error = true;
        }
        displayMessage(json.message, error);
    })
    .catch();
}

const unpublishArticle = (btn) => {
    const csrf = btn.closest('td').querySelector('[name=_csrf]').value;
    const articleId = btn.closest('td').querySelector('[name=id]').value;
    
    const body = {
        id: articleId,
        _csrf: csrf
    };
    
    fetch('/blog/unpublish-article', {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(res => {   
        if(res.status === 200)   {
            btn.classList.remove('btn-light');
            btn.classList.add('btn-success');
            btn.innerHTML = '<i class="fas fa-eye"></i>';

            btn.setAttribute('onclick', 'publishArticle(this)');
            
            const published = btn.closest('tr').querySelector(`[data-published='${articleId}']`);
            published.innerHTML = '<i class="fas fa-times text-danger"></i>';
        }
        return res.json()
    })
    .then(json => {
        let error = false;
        if (json.statusCode >= 400) {
            error = true;
        }
        displayMessage(json.message, error);
    })
    .catch();
}