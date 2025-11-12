const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { OAuth2Strategy } = require('passport-google-oauth');
const bcrypt = require('bcryptjs');
const { UsuarioEntity } = require('../entities/usuarioEntity');

function configurePassport() {
  // Estrategia Local: correo + contraseña
  passport.use(
    new LocalStrategy(
      { usernameField: 'correo', passwordField: 'contraseña', session: false },
      async (correo, password, done) => {
        try {
          const user = await UsuarioEntity.findOne({ where: { correo } });
          if (!user) return done(null, false, { message: 'Credenciales inválidas' });
          let valid = false;
          try {
            valid = await bcrypt.compare(password, user.contraseña);
          } catch (e) {
            // Ignorar error si el hash no es válido; intentar comparación plana
          }
          if (!valid) {
            valid = password === user.contraseña;
          }
          if (!valid) return done(null, false, { message: 'Credenciales inválidas' });
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Estrategia Google OAuth2 (solo login para usuarios existentes por correo)
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback';
  if (clientID && clientSecret) {
    passport.use(
      new OAuth2Strategy(
        { clientID, clientSecret, callbackURL },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = (profile.emails && profile.emails[0] && profile.emails[0].value) || null;
            if (!email) return done(null, false, { message: 'Google no entregó correo' });
            const user = await UsuarioEntity.findOne({ where: { correo: email } });
            if (!user) {
              return done(null, false, { message: 'Usuario no registrado con ese correo' });
            }
            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  }

  // Sin sesiones; serialización mínima
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await UsuarioEntity.findByPk(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = { configurePassport };