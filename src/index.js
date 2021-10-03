document.addEventListener('DOMContentLoaded', () => {
    sendRequest('/quotes', renderQuotes, {}, {'_embed': 'likes'});
    document.getElementById('new-quote-form').addEventListener('submit', handleNewQuoteSubmit);
    document.getElementById('update-quote-form').addEventListener('submit', handleEditSubmitClick);
    document.getElementById('sort').addEventListener('click', handleSortClick);
});

let SORTED = false;

function renderQuotes(quotes) {
    const quoteList = document.getElementById('quote-list');
    quoteList.replaceChildren();
    quotes.forEach(appendQuote);
}

function replaceQuote(quote) {
    document.getElementById(`quote-card-${quote.id}`).replaceWith(createQuote(quote));
}

function appendQuote(quote) {
    const quoteList = document.getElementById('quote-list');
    quoteList.append(createQuote(quote));
    sortList();
}

function createQuote(quote) {
    const quoteCard = document.createElement('li');
    const blockquote = document.createElement('blockquote');
    const quoteText = document.createElement('p');
    const quoteFooter = document.createElement('footer');
    const linebreak = document.createElement('br');
    const likeBttn = document.createElement('button');
    const likeCount = document.createElement('span');
    const editBttn = document.createElement('button');
    const deleteBttn = document.createElement('button');

    quoteCard.className = 'quote-card';
    quoteCard.id = `quote-card-${quote.id}`;
    blockquote.className = 'blockquote';
    quoteText.className = 'mb-0';
    quoteText.textContent = quote.quote;
    quoteFooter.className = 'blockquote-footer';
    quoteFooter.textContent = quote.author;
    likeBttn.className = 'btn-success';
    likeBttn.textContent = 'Likes: ';
    likeBttn.addEventListener('click', () => handleLikeClick(quote.id));
    likeCount.textContent = quote.likes.length;
    editBttn.className = 'btn-primary';
    editBttn.textContent = 'Edit';
    editBttn.addEventListener('click', () => handleEditClick(quote.id));
    deleteBttn.className = 'btn-danger';
    deleteBttn.textContent = 'Delete';
    deleteBttn.addEventListener('click', () => handleDeleteClick(quote.id));

    likeBttn.append(likeCount);
    blockquote.append(quoteText, quoteFooter, linebreak, likeBttn, editBttn, deleteBttn);
    quoteCard.append(blockquote);

    return quoteCard;
}

function sortList() {
    const quoteList = document.getElementById('quote-list');
    const quoteItems = Array.from(quoteList.children);
    const sortingProperty = SORTED ? 'author' : 'id';
    quoteItems.sort((first, second) => {
        const firstProperty = SORTED ? first.querySelector('.blockquote-footer').textContent : +first.id.slice(11);
        const secondProperty = SORTED ? second.querySelector('.blockquote-footer').textContent : +second.id.slice(11);
        if (firstProperty < secondProperty) {
            return -1;
        }
        if (firstProperty > secondProperty) {
            return 1;
        }
        return 0;
    });
    quoteList.replaceChildren(...quoteItems);
}

function handleLikeClick(quoteId) {
    const callback = () => {
        sendRequest(`/quotes/${quoteId}`, replaceQuote, {}, {'_embed': 'likes'})
    };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({
            quoteId: quoteId,
            createdAt: getCurrentTime()
        })
    };
    sendRequest('/likes', callback, options);
}

function handleEditClick(quoteId) {
    const form = document.getElementById('update-quote-form');
    form.setAttribute('quote-id', quoteId);
    form.style.display = 'block';
    form.querySelector('#updated-quote').value = document.querySelector(`#quote-card-${quoteId} p`).textContent;
    form.querySelector('#updated-author').value = document.querySelector(`#quote-card-${quoteId} .blockquote-footer`).textContent;
    form.querySelector('#updated-quote').focus();
}

function handleEditSubmitClick(e) {
    e.preventDefault();
    const form = e.target;

    const callback = () => {
        sendRequest('/quotes', renderQuotes, {}, {'_embed': 'likes'});
    };
    const options = {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({
            quote: form.querySelector('#updated-quote').value,
            author: form.querySelector('#updated-author').value
        })
    };

    sendRequest(`/quotes/${form.getAttribute('quote-id')}`, callback, options)

    form.reset();
    form.setAttribute('quote-id', '')
    form.style.display = 'none';
}

function handleDeleteClick(quoteId) {
    const options = {
        method: 'DELETE'
    };
    const callback = () => {
        sendRequest('/quotes', renderQuotes, {}, {'_embed': 'likes'});
    };
    sendRequest(`/quotes/${quoteId}`, callback, options);
}

function handleSortClick(e) {
    SORTED = !SORTED;
    e.target.textContent = SORTED ? 'Sort By ID' : 'Sort By Author';
    sortList();
}

function handleNewQuoteSubmit(e) {
    e.preventDefault();
    const form = e.target;

    const callback = (quote) => {
        sendRequest(`/quotes/${quote.id}`, appendQuote, () => {}, {'_embed': 'likes'});
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify({
            quote: form.querySelector('#new-quote').value,
            author: form.querySelector('#author').value
        })
    };

    sendRequest('/quotes', callback, options)
    form.reset();
}

function getCurrentTime() {
    const time = new Date();
    return Math.floor(time.valueOf() / 1000);
}

function sendRequest(endpoint, callback, options={}, parameters={}) {
    const paramsString = new URLSearchParams(parameters);
    fetch(`http://localhost:3000${endpoint}?${paramsString}`, options)
        .then(resp => resp.json())
        .then(callback)
        .catch(error => {
            console.error(error);
            console.error(`Endpoint: ${endpoint}`);
            console.table(options);
        })
}