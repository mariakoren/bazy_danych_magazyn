const express = require('express');
const dbo = require('../db/conn');
const { ObjectId } = require('mongodb');

const router = express.Router();

let db;

router.get('/products', (req, res) => {
  const { name, price, quantity, sortBy, sortOrder } = req.query;

  const filterOptions = {};
  if (name) filterOptions.name = new RegExp(name, 'i');
  if (price) filterOptions.price = parseFloat(price);
  if (quantity) filterOptions.quantity = parseInt(quantity);

  const sortOptions = {};
  if (sortBy) sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  db = dbo.getDb();
  db.collection('products')
    .find(filterOptions)
    .sort(sortOptions)
    .toArray()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => {
      res
        .status(500)
        .json({ error: 'Problem z pobraniem danych o produktach' });
    });
});

router.post('/products', (req, res) => {
  const newProduct = req.body;

  db = dbo.getDb();
  db.collection('products')
    .findOne({ name: newProduct.name })
    .then((result) => {
      if (result) {
        res.status(400).json({ error: 'Produkt o tej nazwie już istnieje' });
      } else {
        db.collection('products')
          .insertOne(newProduct)
          .then((result) => {
            res.status(201).json(result);
          })
          .catch(() => {
            res.status(500).json({ error: 'Problem z dodaniem produktu' });
          });
      }
    })
    .catch(() => {
      res.status(500).json({ error: 'Problem z dodaniem produktu' });
    });
});

router.put('/products/:id', (req, res) => {
  const updatedProduct = req.body;

  if (ObjectId.isValid(req.params.id)) {
    db = dbo.getDb();
    db.collection('products')
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updatedProduct })
      .then((result) => {
        res.status(200).json(result);
      })
      .catch(() => {
        res.status(500).json({ error: 'Problem z modyfikacją produktu' });
      });
  } else {
    res.status(500).json({ error: 'Błędny identyfikator produktu' });
  }
});

router.delete('/products/:id', (req, res) => {
  if (ObjectId.isValid(req.params.id)) {
    db = dbo.getDb();
    db.collection('products')
      .findOne({ _id: new ObjectId(req.params.id) })
      .then((result) => {
        if (!result) {
          res
            .status(400)
            .json({ error: 'Brak produktu o tym identyfikatorze' });
        } else {
          db.collection('products')
            .deleteOne({ _id: new ObjectId(req.params.id) })
            .then((result) => {
              res.status(200).json(result);
            })
            .catch(() => {
              res.status(500).json({ error: 'Problem z usunięciem produktu' });
            });
        }
      })
      .catch(() => {
        res.status(500).json({ error: 'Problem z usunięciem produktu' });
      });
  } else {
    res.status(500).json({ error: 'Błędny identyfikator produktu' });
  }
});

router.get('/products/report', (req, res) => {
  db = dbo.getDb();
  db.collection('products')
    .aggregate([
      {
        $project: {
          _id: 0,
          name: 1,
          totalQuantity: '$quantity',
          totalValue: { $multiply: ['$quantity', '$price'] },
        },
      },
    ])
    .toArray()
    .then((result) => {
      res.status(200).json(result);
    })
    .catch(() => {
      res.status(500).json({
        error: 'Problem z wygenerowaniem raportu',
      });
    });
});

module.exports = router;