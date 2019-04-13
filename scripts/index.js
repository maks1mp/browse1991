const auth_key = '563492ad6f917000010000016d3a0d6656d348f082ea13e16956f0dd';

class Fetcher {
    static url = 'https://api.pexels.com/v1';

    constructor(key) {
        this.auth_key = key;
    }

    performSearchRequest(url) {
        const headers = new Headers({
            Authorization: this.auth_key
        });

        return fetch(url, {
                headers
            })
            .then(response => response.json())
            .then(data => {
                const photos = data.photos.map(photo => {
                    return {
                        url: photo.photographer_url,
                        description: photo.photographer,
                        src: photo.src.medium || photo.url
                    }
                });

                return {
                    nextPage: data.next_page,
                    photos: photos || []
                };
            });
    }

    getPhotos(query, {
        per_page = 24,
        page = 1
    } = {}) {
        const url = `${Fetcher.url}/search?query=${encodeURIComponent(query)}&per_page=${per_page}&page=${page}`;

        return this.performSearchRequest(url);
    }
}

class Gallery {
    constructor(root) {
        this.root = root;
        this.sideEffects = [];
    }

    addSideEffect(fn) {
        this.sideEffects.push(fn);
    }

    callSideEffects(payload) {
        this.sideEffects.forEach(fn => fn(payload));
    }

    getMessage(text) {
        return (
            `<div class="heading text-center">${text}</div>`
        )
    }

    renderLoader() {
        this.root.innerHTML = this.getMessage('Loading...');
    }

    renderError() {
        this.root.innerHTML = this.getMessage('Oops, something went wrong, try again later!');
    }

    render(payload = {}) {
        const {
            photos = []
        } = payload;

        if (photos.length > 0) {
            this.root.innerHTML = photos.reduce((tpl, next) => {
                tpl += (
                    `
                <div class="gallery__item">
                <div class="gallery__item-image">
                    <img src="${next.src}" alt="">
                </div>
                <div>
                    <div class="gallery__item-description">
                        <p class="gallery__item-description-text">
                            ${next.description}
                        </p>
                        <span class="star">
                            <i class="icon ion-md-star"></i>
                        </span>
                    </div>
                    <div class="gallery__item-social">
                        <a class="gallery__item-social-share" href="${next.url}">
                            Share
                        </a>
                        <div class="">
                            <a href="${next.url}">
                                <i class="icon ion-logo-twitter"></i>
                            </a>
                            <a href="${next.url}">
                                <i class="icon ion-logo-facebook"></i>
                            </a>
                            <a href="${next.url}">
                                <i class="icon ion-logo-pinterest"></i>
                            </a>
                            <a href="${next.url}">
                                <i class="icon ion-logo-tumblr"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
                `
                );

                return tpl;
            }, '')
        } else {
            this.root.innerHTML = this.getMessage('Not found');
        }

        this.callSideEffects(payload);
    }
}

function ready() {
    const queryField = document.getElementById('query');
    const nextPageBtn = document.getElementById('next_page');
    let nextPageURL = null;

    const fetcher = new Fetcher(auth_key);
    const gallery = new Gallery(document.getElementById('gallery'));

    gallery.addSideEffect(payload => {
        if (payload.nextPage && payload.nextPage !== nextPageURL) {
            nextPageURL = payload.nextPage;
            nextPageBtn.disabled = false;
        } else {
            nextPageBtn.disabled = true;
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (nextPageURL) {
            gallery.renderLoader();
            fetcher.performSearchRequest(nextPageURL)
                .then(data => gallery.render(data))
                .catch(() => gallery.renderError());
        }
    });

    document.getElementById('search').addEventListener('submit', e => {
        e.preventDefault();
        gallery.renderLoader();
        fetcher.getPhotos(queryField.value)
            .then(data => gallery.render(data))
            .catch(() => gallery.renderError());
    });
}

window.document.addEventListener('DOMContentLoaded', ready);