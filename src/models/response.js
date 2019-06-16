class FailResponse {
  constructor(code, desc) {
    this.err_code = code;
    this.err_desc = desc;
  }
};

class SuccessResponse {
  constructor(code, desc, data) {
    this.err_code = code;
    this.err_desc = desc;
    this.data = data;
  }
};

module.exports = {
  FailResponse,
  SuccessResponse,
};
