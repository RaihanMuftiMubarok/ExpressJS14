const express = require('express');
const router = express.Router();
//import express validator
const {body, validationResult } = require('express-validator');
//import database
const connection = require('../config/db');
const fs = require('fs')
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images')
    },
    filename: (req, file, cb) => {
        console.log(file)
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const fileFilter = (req, file, cb) => {
    //mengecek jenis file yg diizinkan (JPEG atau PNG)
    if (file.mimetype === 'image/jpeg'||file.mimetype === 'image/png'){
        cb(null, true); //izinkan file
    }else{
        cb(new Error('Jenis file tidak diizinkan'),false);
    }
}
const upload = multer({storage: storage, fileFilter: fileFilter})

router.get('/', function (req, res){
    connection.query('select a.no_pol as no_polisi, a.nama_kendaraan as kendaraan, a.gambar as gambar_kendaraan ,b.id_transmisi as transmisi'+
    ' from kendaraan a join transmisi b '+
    'on b.id_transmisi=a.id_transmisi order by a.no_pol desc', function(err, rows){
        if(err){
            return res.status(500).json({
                status:false,
                message: 'Server Failed',
            })
        }else{
            return res.status(200).json({
                status:true,
                message: 'Data kendaraan',
                data: rows
            })
        }
    })
});

router.post('/store', upload.single("gambar"), [
    //validation
    body('no_pol').notEmpty(),
    body('nama_kendaraan').notEmpty(),
    body('id_transmisi').notEmpty(),
],(req, res) => {
    const error = validationResult(req);
    if(!error.isEmpty()) {
        return res.status(422).json({
            error: error.array()
        });
    }
    let Data = {
        no_pol: req.body.no_pol,
        nama_kendaraan: req.body.nama_kendaraan,
        id_transmisi: req.body.id_transmisi,
        gambar: req.file.filename
    }
    connection.query('insert into kendaraan set ?', Data, function(err, rows){
        if(err){
            return res.status(500).json({
                status: false,
                message: 'Server Error',
                error:err
            })
        }else{
            return res.status(201).json({
                status: true,
                message: 'Success!',
                data: rows[0]
            })
        }
    })
})

router.get('/(:no_pol)', function (req, res){
    let no_pol = req.params.no_pol;
    connection.query(`select a.no_pol as no_polisi, a.nama_kendaraan as kendaraan, a.gambar as gambar_kendaraan ,b.id_transmisi as transmisi from kendaraan a join transmisi b on b.id_transmisi=a.id_transmisi where no_pol = ${no_pol}`, function (err, rows){
        if(err){
            return res.status(500).json({
                status: false,
                message: 'Server Error',
            })
        }if(rows.length <=0){
            return res.status(404).json({
                status: false,
                message: 'Not Found',
            })
        }else{
            return res.status(200).json({
                status: true,
                message: 'Data kendaraan',
                data: rows[0]
            })
        }
    })
})

router.patch('/update/:no_pol', upload.single("gambar") ,[
    body('no_pol').notEmpty(),
    body('nama_kendaraan').notEmpty(),
    body('id_transmisi').notEmpty(),
], (req, res) => {
    const error = validationResult(req);
    if(!error.isEmpty()){
        return res.status(422).json({
            error: error.array()
        });
    }
    
    let no_pol = req.params.no_pol;
    let gambar = req.file ? req.file.filename : null;
    connection.query(`select a.no_pol as no_polisi, a.nama_kendaraan as kendaraan, a.gambar as gambar_kendaraan ,b.id_transmisi as transmisi from kendaraan a join transmisi b on b.id_transmisi=a.id_transmisi where no_pol = ${no_pol}`, function (err, rows){
        if(err){
            return res.status(500).json({
                status: false,
                message: 'Server Error',
            })
        }if(rows.length <=0){
            return res.status(404).json({
                status: false,
                message: 'Not Found',
            })
        }
        const namaFileLama = rows[0].gambar;
    
        //hapus file lama
        if (namaFileLama && gambar){
            const pathFileLama = path.join(__dirname,'../public/images', namaFileLama);
            fs.unlinkSync(pathFileLama);
        }
        let Data = {
            no_pol: req.body.no_pol,
            nama_kendaraan: req.body.nama_kendaraan,
            id_transmisi: req.body.id_transmisi,
            gambar: gambar,
        }
        connection.query(`update kendaraan set ? where no_pol = ${no_pol}`, Data, function (err, rows){
            if(err){
                return res.status(500).json({
                    status: false,
                    message: 'Server Error',
                })
            }else{
                return res.status(200).json({
                    status: true,
                    message: 'Update Success..!'
                })
            }
        })
    })
})
router.delete('/delete/(:no_pol)', function(req, res){
    let no_pol = req.params.no_pol;
    connection.query(`select a.no_pol as no_polisi, a.nama_kendaraan as kendaraan, a.gambar as gambar_kendaraan ,b.id_transmisi as transmisi from kendaraan a join transmisi b on b.id_transmisi=a.id_transmisi where no_pol = ${no_pol}`, function (err, rows){
        if(err){
            return res.status(500).json({
                status: false,
                message: 'Server Error',
            })
        }if(rows.length <=0){
            return res.status(404).json({
                status: false,
                message: 'Not Found',
            })
        }
        const namaFileLama = rows[0].gambar;
    
        //hapus file lama
        if (namaFileLama){
            const pathFileLama = path.join(__dirname,'../public/images', namaFileLama);
            fs.unlinkSync(pathFileLama);
        }
        connection.query(`delete from kendaraan where no_pol = ${no_pol}`, function (err, rows){
            if(err){
                return res.status(500).json({
                    status: false,
                    message: 'Server Error',
                })
            }else{
                return res.status(200).json({
                    status: true,
                    message: 'Data has been delete !',
                })
            }
        })
    })
})
module.exports = router;