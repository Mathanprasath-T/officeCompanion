const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email.trim());
};

const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 8;
};

const sanitizeString = (str) => {
  return typeof str === 'string' ? str.trim() : '';
};

module.exports = {
  isValidEmail,
  isValidPassword,
  sanitizeString,
};
