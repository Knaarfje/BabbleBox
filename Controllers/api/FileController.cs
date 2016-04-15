using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNet.Hosting;
using Microsoft.AspNet.Http;
using Microsoft.AspNet.Mvc;
using Microsoft.Net.Http.Headers;

// For more information on enabling Web API for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace BabbleBox.api.Controllers
{
    [Route("api/file")]
    public class FileController : Controller
    {

        private IHostingEnvironment _environment;

        public FileController(IHostingEnvironment environment)
        {
            _environment = environment;
        }

        // POST api/values
        [HttpPost("post")]
        public async Task<string> Post(string Name, string Email)
        {
            Console.WriteLine(Name);
            var uploads = Path.Combine(_environment.WebRootPath, "uploads", $"{Name} - {Email}");

            if (!Directory.Exists(uploads))
            {
                System.IO.Directory.CreateDirectory(uploads);
            }

            using (FileStream target = System.IO.File.Open(Path.Combine(_environment.WebRootPath, "uploads") + "/entries.txt", FileMode.Append, FileAccess.Write))
            {
                using (StreamWriter writer = new StreamWriter(target))
                {
                    writer.WriteLine($"{Name}\t\t\t{Email}");
                }
            }

            foreach (var f in Request.Form.Files)
            {
                await f.SaveAsAsync(Path.Combine(uploads, $"{GetFileName(uploads, Name)}.webm"));
            }

            return "Done";
        }

        private string GetFileName(string path, string name, int attempts = 0)
        {
            var attemptsString = attempts > 0 ? $" ({attempts})" : "";

            if (System.IO.File.Exists(Path.Combine(path, $"{name}{attemptsString}.webm")))
            {

                return GetFileName(path, name, attempts + 1);
            }

            return $"{name}{attemptsString}";
        }
    }
}
