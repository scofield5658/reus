export class FailResponse {
  err_code: number;
  err_desc: string;

  constructor(code: number, desc: string) {
    this.err_code = code;
    this.err_desc = desc;
  }
};

export class SuccessResponse {
  err_code: number;
  err_desc: string;
  data: unknown;

  constructor(code: number, desc: string, data: unknown) {
    this.err_code = code;
    this.err_desc = desc;
    this.data = data;
  }
};
