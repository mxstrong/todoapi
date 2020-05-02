﻿using Mxstrong.Models;
using System.Threading.Tasks;

namespace Mxstrong.Data
{
  public interface IAuthRepository
  {
    Task<User> Register(User user, string password);
    Task<User> Login(string email, string pasword);
    Task<bool> UserExists(string email);
  }
}
