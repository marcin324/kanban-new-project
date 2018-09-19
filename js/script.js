/*--------------- APP.JS ---------------*/

'use strict';

var baseUrl = 'https://kodilla.com/pl/bootcamp-api';
var myHeaders = {
    'X-Client-Id': '3466',
    'X-Auth-Token': '085050f8dcad7e7102f708ea4ec567e9',
};

/* Pobieranie tablicy - (metoda GET) adres url + endpoint; po odebraniu odpowiedzi tworzona jest jest kolumna - funkcja setupColumns */
fetch(baseUrl + '/board', { headers: myHeaders })
  
        .then(function(resp) {
            return resp.json();
        })
      
        .then(function(resp) {
            setupColumns(resp.columns);
        });

/* Funkcja, która tworzy tyle kolumn, ile otrzymaliśmy w odpowiedzi od serwera - fetch API powyżej - a następnie każdą kolumnę
przypina do tablicy; na końcu mamy funkcję setupCards, która ustawia karty w odpowiednich kolumnach - wszystko zgodnie z odpowiedzią
z serwera */
function setupColumns(columns) {
    columns.forEach(function (column) {
        var col = new Column(column.id, column.name);
        board.addColumn(col);
        setupCards(col, column.cards);
    });
}

/* Funkcja, która iteruje po wszystkich kartach, tworzy je i dodaje do odpowiedniej kolumny */
function setupCards(col, cards) {
    cards.forEach(function (card) {
        var cardObj = new Card(card.id, card.name);
        col.addCard(cardObj);
    });
}

/* Funkcja generująca templatki */
function generateTemplate(name, data, basicElement) {
    var template = document.getElementById(name).innerHTML;
    var element = document.createElement(basicElement || 'div');
  
    Mustache.parse(template);
    element.innerHTML = Mustache.render(template, data);
  
    return element;
}

/*--------------- COLUMN.JS ---------------*/

/* Klasa 'Column' - z niej tworzymy nowe kolumny Kanbana */
function Column(id, name) { // Dodanie parametru 'id' w funkcji konstruującej
    var self = this;

    this.id = id; // 'id' już nie jest generowane losowo, ale przez serwer
    this.name = name || 'no name given'; // W razie pustej nazwy kolumny, będzie nadawana nazwa
  	this.element = generateTemplate('column-template', { name: this.name, id: this.id });

  	this.element.querySelector('.column').addEventListener('click', function (event) {
  	    if (event.target.classList.contains('btn-delete')) {
  	      	self.removeColumn();
  	    }
  	
  		  /* Dodawanie nowej karty */
  	    if (event.target.classList.contains('add-card')) {
  	      	
            /* Tworzenie modala */        
            var modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML =`Opis: <textarea id="modal-desc"></textarea><br>
            <button id="modal-add-button">Add</button>
            <button id="modal-cancel-button">Cancel</button>`;

            document.body.appendChild(modal);

            /* Nasłuchiwacz do buttona 'Cancel' */
            document.querySelector('#modal-cancel-button').addEventListener('click', function(){
            modal.remove();
            })

            /* Nasłuchiwacz do buttona 'Add' */
            document.querySelector('#modal-add-button').addEventListener('click', function(){
                var cardName = document.querySelector('#modal-desc').value;
                var category = document.querySelector('#modal-category').value;

                event.preventDefault();
          
                var data = new FormData();
                data.append('name', cardName);
                data.append('bootcamp_kanban_column_id', self.id);

                fetch(baseUrl + '/card', {
                    method: 'POST',
                    headers: myHeaders,
                    body: data,
                })
                  
                    .then(function(res) {
                        return res.json();
                    })
                  
                    .then(function(resp) {
                        var card = new Card(resp.id, cardName);
                        self.addCard(card);
                    });
                      
                modal.remove();
            });
		    }
    });
}

/* Metody dla klasy 'Column' - dodawanie kart i usuwanie kolumn */
Column.prototype = {
  	addCard: function(card) {
        this.element.querySelector('ul').appendChild(card.element);
  	},
  	
  	/* Usuwanie kolumny - adres url z endpointem i id kolumny; słówko self zamiast this - utrata kontekstu */
  	removeColumn: function() {
        var self = this;
        fetch(baseUrl + '/column/' + self.id, { method: 'DELETE', headers: myHeaders })
  	    
      	    .then(function(resp) {
                return resp.json();
      	    })
      	    
      	    .then(function(resp) {
                self.element.parentNode.removeChild(self.element);
      	    });
  	}
};

/*--------------- CARDS.JS ---------------*/

/* Klasa 'Card' */
function Card(id, name) {
    var self = this;

    this.id = id;
    this.name = name || 'no name give';
    this.element = generateTemplate('card-template', { description: this.name }, 'li');
    /* Przypięcie nasłuchiwacza do usuwania kart */
    this.element.querySelector('.card').addEventListener('click', function (event) {
        event.stopPropagation();

        if (event.target.classList.contains('btn-delete')) {
            self.removeCard();
        }
    });
}

/* Meoda dla klasy 'Card' - usuwanie kart */
Card.prototype = {
    /* Usuwanie karty - adres url z endpointem i id kolumny; słówko self zamiast this - utrata kontekstu */
    removeCard: function() {
        var self = this;

        fetch(baseUrl + '/card/' + self.id, { method: 'DELETE', headers: myHeaders })
    
            .then(function(resp) {
                return resp.json();
            })
        
            .then(function(resp) {
                self.element.parentNode.removeChild(self.element);
            })
    }
}

/*--------------- BOARD.JS ---------------*/

/* Tablica - obiekt stworzony metodą literału */
var board = {
    name: 'Tablica Kanban',
    /* Metoda tworzenia nowej kolumny */
    addColumn: function(column) {
        this.element.appendChild(column.element);
        initSortable(column.id);
    },

    /* Tu jest zapisany element, w który będą wstawiane nowe kolumny */
    element: document.querySelector('#board .column-container')
};


/* Przypięcie do przycisku 'Add a column' nasłuchiwacza, który uruchamia prompt i dodaje nową kolumnę do tablicy */
document.querySelector('#board .create-column').addEventListener('click', function() {
    var name = prompt('Enter a column name');
    
    /* Dodawanie nowej kolumny do tabicy - adres url z endpointem POST*/
    var data = new FormData();

    data.append('name', name);

    fetch(baseUrl + '/column', {
        method: 'POST',
        headers: myHeaders,
        body: data,
    })
      
        .then(function(resp) {
            return resp.json();
        })
          
        .then(function(resp) {
            var column = new Column(resp.id, name);
            board.addColumn(column);
        });
});

/* Funkcja do manipulowania kartami */	
function initSortable(id) {
  	var el = document.getElementById(id);
  	var sortable = Sortable.create(el, {
      	group: 'kanban',
      	sort: true
  	});
}